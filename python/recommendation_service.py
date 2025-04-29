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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'database.env'))

# Connect to your database
conn = psycopg2.connect(
    host=os.getenv('PGHOST'),
    database=os.getenv('PGDATABASE'),
    user=os.getenv('PGUSER'),
    password=os.getenv('PGPASSWORD'),
    port=5432,
    sslmode='require'
)

# Fetch interaction data from database
def get_interactions():
    query = """
        SELECT user_id, event_id, action_type
        FROM user_event_interactions
    """
    df = pd.read_sql_query(query, conn)
    df['rating'] = df['action_type'].apply(lambda x: 1 if x == 'interested' else 0)
    return df

# Build user-event matrix for collaborative filtering
def build_user_event_matrix(df):
    matrix = df.pivot_table(index='user_id', columns='event_id', values='rating', fill_value=0)
    return matrix

# Recommend events for a user
def recommend_events(user_id, top_n=10):
    df = get_interactions()
    user_event_matrix = build_user_event_matrix(df)

    if user_id not in user_event_matrix.index:
        logger.info(f"User {user_id} not found in interaction data. Returning top popular events.")
        top_events = df[df['rating'] == 1]['event_id'].value_counts().head(top_n).index.tolist()
        return top_events

    similarity = cosine_similarity(user_event_matrix)
    user_idx = user_event_matrix.index.get_loc(user_id)
    user_sim = similarity[user_idx]

    weighted_scores = np.dot(user_sim, user_event_matrix.values)
    event_scores = pd.Series(weighted_scores, index=user_event_matrix.columns)

    seen_events = set(df[df['user_id'] == user_id]['event_id'])
    recommendations = event_scores.drop(labels=seen_events).sort_values(ascending=False).head(top_n)

    return recommendations.index.tolist()

@app.route("/health", methods=["GET"])
def health():
    try:
        df = get_interactions()
        user_count = df['user_id'].nunique()
        event_count = df['event_id'].nunique()
        return jsonify({
            "status": "ok",
            "users_known": user_count,
            "events_known": event_count,
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/recommend", methods=["GET"])
def recommend():
    try:
        user_id = request.args.get("user_id", type=int)
        if user_id is None:
            return jsonify({"error": "Missing user_id parameter"}), 400

        recommendations = recommend_events(user_id)
        return jsonify(recommendations)

    except Exception as e:
        logger.error(f"Recommendation failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    logger.info("Starting scikit-learn based recommendation service...")
    app.run(host="0.0.0.0", port=8000, debug=False)

