from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import logging
import time
import os
from dotenv import load_dotenv
import traceback

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
        # Get user preferences
        user_preferences = get_user_preferences(user_id)
        
        # Get user's interaction data
        df = get_interactions()
        user_event_matrix = build_user_event_matrix(df)

        if user_id not in user_event_matrix.index:
            logger.warning(f"User {user_id} not found in interaction data. Returning top popular events.")
            top_events = df[df['rating'] == 1]['event_id'].value_counts().head(top_n).index.tolist()
            logger.info(f"Returning {len(top_events)} popular events for new user")
            return top_events

        # Calculate base recommendations using collaborative filtering
        similarity = cosine_similarity(user_event_matrix)
        user_idx = user_event_matrix.index.get_loc(user_id)
        user_sim = similarity[user_idx]

        weighted_scores = np.dot(user_sim, user_event_matrix.values)
        event_scores = pd.Series(weighted_scores, index=user_event_matrix.columns)

        # Get all events to adjust scores based on preferences
        events = get_all_events()
        event_scores_dict = event_scores.to_dict()

        # Adjust scores based on preferences that matter
        for event in events:
            event_id = event['id']
            if event_id in event_scores_dict:
                score = event_scores_dict[event_id]
                
                # Only adjust score if preference matters
                if user_preferences.get('timeMatters', True):
                    if user_preferences.get('preferredTime') and event.get('time') == user_preferences.get('preferredTime'):
                        score *= 1.2  # Boost score if time matches
                
                if user_preferences.get('distanceMatters', True):
                    if user_preferences.get('preferredDistance') and event.get('distance') == user_preferences.get('preferredDistance'):
                        score *= 1.2  # Boost score if distance matches
                
                if user_preferences.get('budgetMatters', True):
                    if user_preferences.get('budgetRange') and event.get('price') == user_preferences.get('budgetRange'):
                        score *= 1.2  # Boost score if budget matches
                
                if user_preferences.get('sizeMatters', True):
                    if user_preferences.get('eventSize') and event.get('size') == user_preferences.get('eventSize'):
                        score *= 1.2  # Boost score if size matches
                
                event_scores_dict[event_id] = score

        # Convert back to Series and sort
        event_scores = pd.Series(event_scores_dict)
        seen_events = set(df[df['user_id'] == user_id]['event_id'])
        recommendations = event_scores.drop(labels=seen_events).sort_values(ascending=False).head(top_n)

        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
        return recommendations.index.tolist()
    except Exception as e:
        logger.error(f"Error in recommend_events for user {user_id}: {e}")
        raise

def get_user_preferences(user_id):
    """Fetch user preferences from the database"""
    try:
        query = """
            SELECT preferences FROM users WHERE user_id = %s
        """
        cursor = conn.cursor()
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        
        if result and result[0]:
            return result[0]
        return {}
    except Exception as e:
        logger.error(f"Error fetching user preferences: {e}")
        return {}

def get_all_events():
    """Fetch all events from the database"""
    try:
        query = """
            SELECT id, time, distance, price, size FROM events
        """
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        
        return [{
            'id': row[0],
            'time': row[1],
            'distance': row[2],
            'price': row[3],
            'size': row[4]
        } for row in result]
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        return []

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

@app.route("/recommend", methods=["GET"])
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
        error_type = type(e).__name__
        error_message = str(e)
        error_traceback = e.__traceback__
        logger.error(f"Recommendation failed for user_id {user_id}: {error_type} - {error_message}", exc_info=True)
        
        # Get the specific line where the error occurred
        error_details = traceback.format_exc()
        
        return jsonify({
            "error": "Recommendation failed",
            "error_type": error_type,
            "error_message": error_message,
            "error_details": error_details
        }), 500

if __name__ == "__main__":
    logger.info("Starting scikit-learn based recommendation service...")
    app.run(host="0.0.0.0", port=8000, debug=False)

