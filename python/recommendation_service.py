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

def get_db_connection():
    """Helper function to create a new database connection"""
    return psycopg2.connect(
        host=os.getenv('PGHOST'),
        database=os.getenv('PGDATABASE'),
        user=os.getenv('PGUSER'),
        password=os.getenv('PGPASSWORD'),
        port=5432,
        sslmode='require'
    )

# Fetch interaction data from database
def get_interactions():
    logger.info("Fetching interaction data from database")
    try:
        conn = get_db_connection()
        query = """
            SELECT user_id, event_id, action_type
            FROM user_event_interactions
        """
        df = pd.read_sql_query(query, conn)
        df['rating'] = df['action_type'].apply(lambda x: 1 if x == 'interested' else 0)
        logger.info(f"Retrieved {len(df)} interactions from database")
        conn.close()
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

        # Check for cold start scenario
        if user_id not in user_event_matrix.index or user_event_matrix.shape[0] < 2:
            logger.info(f"Not enough users to compute similarity. Returning top-rated events.")
            top_events = df[df['rating'] == 1]['event_id'].value_counts().head(top_n).index.tolist()
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
                    if user_preferences.get('preferredTime') and event.get('start_time') == user_preferences.get('preferredTime'):
                        score *= 1.2  # Boost score if time matches
                
                if user_preferences.get('locationMatters', True):
                    if user_preferences.get('preferredLocation') and event.get('location') == user_preferences.get('preferredLocation'):
                        score *= 1.2  # Boost score if location matches
                
                if user_preferences.get('typeMatters', True):
                    if user_preferences.get('preferredType') and event.get('event_type') == user_preferences.get('preferredType'):
                        score *= 1.2  # Boost score if event type matches
                
                event_scores_dict[event_id] = score

        # Convert back to Series and sort
        event_scores = pd.Series(event_scores_dict)
        seen_events = set(df[df['user_id'] == user_id]['event_id'])
        recommendations = event_scores.drop(labels=seen_events).sort_values(ascending=False).head(top_n)

        # If we don't have enough recommendations, add popular events
        if len(recommendations) < top_n:
            logger.info(f"Not enough personalized recommendations. Adding popular events.")
            popular_events = df[df['rating'] == 1]['event_id'].value_counts().head(top_n).index.tolist()
            for event_id in popular_events:
                if event_id not in recommendations.index and event_id not in seen_events:
                    recommendations[event_id] = 0.5  # Add with a lower score
                    if len(recommendations) >= top_n:
                        break

        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
        return recommendations.index.tolist()
    except Exception as e:
        logger.error(f"Error in recommend_events for user {user_id}: {e}")
        # Fallback to popular events if there's an error
        logger.info("Falling back to popular events due to error")
        return df[df['rating'] == 1]['event_id'].value_counts().head(top_n).index.tolist()

def get_user_preferences(user_id):
    """Fetch user preferences from the database"""
    try:
        conn = get_db_connection()
        query = """
            SELECT preferences FROM users WHERE user_id = %s
        """
        cursor = conn.cursor()
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result and result[0]:
            return result[0]
        return {}
    except Exception as e:
        logger.error(f"Error fetching user preferences: {e}")
        return {}

def get_all_events():
    """Fetch all events from the database"""
    try:
        conn = get_db_connection()
        query = """
            SELECT id, title, event_type, location, event_start_date, 
                   event_end_date, start_time, end_time, tickets, 
                   description, link_to, image_url 
            FROM events
        """
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return [{
            'id': row[0],
            'title': row[1],
            'event_type': row[2],
            'location': row[3],
            'event_start_date': row[4],
            'event_end_date': row[5],
            'start_time': row[6],
            'end_time': row[7],
            'tickets': row[8],
            'description': row[9],
            'link_to': row[10],
            'image_url': row[11]
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
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # Get recommended event IDs
        recommended_event_ids = recommend_events(user_id)
        
        # Get full event data for recommended events
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create a parameterized query with the correct number of placeholders
        placeholders = ','.join(['%s'] * len(recommended_event_ids))
        query = f"""
            SELECT id, title, event_type, location, event_start_date, 
                   event_end_date, start_time, end_time, tickets, 
                   description, link_to, image_url 
            FROM events 
            WHERE id IN ({placeholders})
        """
        
        cursor.execute(query, recommended_event_ids)
        events = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format the response
        formatted_events = [{
            'id': event[0],
            'title': event[1],
            'category': event[2],
            'location': event[3],
            'event_start_date': event[4],
            'event_end_date': event[5],
            'start_time': event[6],
            'end_time': event[7],
            'tickets': event[8],
            'shortText': event[9],
            'link_to': event[10],
            'image': event[11] or 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80'
        } for event in events]
        
        return jsonify(formatted_events)
    except Exception as e:
        logger.error(f"Error in recommend endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/favorites", methods=["GET"])
def get_favorites():
    logger.info("Favorites request received")
    try:
        user_id = request.args.get("user_id", type=int)
        if user_id is None:
            logger.warning("Favorites request missing user_id parameter")
            return jsonify({"error": "Missing user_id parameter"}), 400

        logger.info(f"Fetching favorites for user_id: {user_id}")
        
        # Get user's interested events
        conn = get_db_connection()
        query = """
            SELECT e.* FROM events e
            JOIN user_event_interactions uei ON e.id = uei.event_id
            WHERE uei.user_id = %s AND uei.action_type = 'interested'
            ORDER BY e.event_start_date DESC
        """
        cursor = conn.cursor()
        cursor.execute(query, (user_id,))
        events = cursor.fetchall()
        cursor.close()
        conn.close()

        # Format the events
        formatted_events = [{
            'id': event[0],
            'title': event[1],
            'category': event[2],
            'location': event[3],
            'event_start_date': event[4],
            'event_end_date': event[5],
            'start_time': event[6],
            'end_time': event[7],
            'tickets': event[8],
            'description': event[9],
            'link_to': event[10],
            'image_url': event[11]
        } for event in events]

        logger.info(f"Successfully fetched {len(formatted_events)} favorites for user {user_id}")
        return jsonify(formatted_events)

    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        logger.error(f"Failed to fetch favorites for user_id {user_id}: {error_type} - {error_message}", exc_info=True)
        return jsonify({
            "error": "Failed to fetch favorites",
            "error_type": error_type,
            "error_message": error_message
        }), 500

if __name__ == "__main__":
    logger.info("Starting scikit-learn based recommendation service...")
    app.run(host="0.0.0.0", port=8000, debug=False)

