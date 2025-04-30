# recommendation_service.py

from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import logging
import time
import os
from dotenv import load_dotenv

app = Flask(__name__)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'database.env'))

# Connect to your database
try:
    conn = psycopg2.connect(
        host=os.getenv('PGHOST'),
        database=os.getenv('PGDATABASE'),
        user=os.getenv('PGUSER'),
        password=os.getenv('PGPASSWORD'),
        port=5432,
        sslmode='require'
    )
    logger.info("Successfully connected to the database")
except Exception as e:
    logger.error(f"Failed to connect to database: {e}")
    raise

# Fetch interaction data from database
def get_interactions():
    logger.info("Fetching interaction data from database")
    try:
        query = """
            SELECT user_id, event_id, action_type
            FROM user_event_interactions
        """
        df = pd.read_sql_query(query, conn)
        df['rating'] = df['action_type'].apply(lambda x: 1 if x == 'interested' else 0)
        logger.info(f"Retrieved {len(df)} interactions from database")
        return df
    except Exception as e:
        logger.error(f"Error fetching interactions: {e}")
        raise

# Build user-event matrix for collaborative filtering
def build_user_event_matrix(df):
    logger.info("Building user-event matrix")
    try:
        matrix = df.pivot_table(index='user_id', columns='event_id', values='rating', fill_value=0)
        logger.info(f"Matrix built with shape: {matrix.shape}")
        return matrix
    except Exception as e:
        logger.error(f"Error building user-event matrix: {e}")
        raise

# Recommend events for a user
def recommend_events(user_id, top_n=10):
    logger.info(f"Starting recommendation process for user {user_id}")
    try:
        df = get_interactions()
        user_event_matrix = build_user_event_matrix(df)

        if user_id not in user_event_matrix.index:
            logger.warning(f"User {user_id} not found in interaction data. Returning top popular events.")
            top_events = df[df['rating'] == 1]['event_id'].value_counts().head(top_n).index.tolist()
            logger.info(f"Returning {len(top_events)} popular events for new user")
            return top_events

        similarity = cosine_similarity(user_event_matrix)
        user_idx = user_event_matrix.index.get_loc(user_id)
        user_sim = similarity[user_idx]

        weighted_scores = np.dot(user_sim, user_event_matrix.values)
        event_scores = pd.Series(weighted_scores, index=user_event_matrix.columns)

        seen_events = set(df[df['user_id'] == user_id]['event_id'])
        recommendations = event_scores.drop(labels=seen_events).sort_values(ascending=False).head(top_n)

        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
        return recommendations.index.tolist()
    except Exception as e:
        logger.error(f"Error in recommend_events for user {user_id}: {e}")
        raise

@app.route("/health", methods=["GET"])
def health():
    logger.info("Health check requested")
    try:
        df = get_interactions()
        user_count = df['user_id'].nunique()
        event_count = df['event_id'].nunique()
        logger.info(f"Health check successful - Users: {user_count}, Events: {event_count}")
        return jsonify({
            "status": "ok",
            "users_known": user_count,
            "events_known": event_count,
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/recommendations", methods=["GET"])
def recommend():
    logger.info("Recommendation request received")
    try:
        user_id = request.args.get("user_id", type=int)
        if user_id is None:
            logger.warning("Recommendation request missing user_id parameter")
            return jsonify({"error": "Missing user_id parameter"}), 400

        logger.info(f"Processing recommendation for user_id: {user_id}")
        recommendations = recommend_events(user_id)
        logger.info(f"Successfully generated recommendations for user {user_id}")
        return jsonify(recommendations)

    except Exception as e:
        logger.error(f"Recommendation failed for user_id {user_id}: {e}", exc_info=True)
        return jsonify({
            "error": "Recommendation failed",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    logger.info("Starting scikit-learn based recommendation service...")
    app.run(host="0.0.0.0", port=8000, debug=False)

