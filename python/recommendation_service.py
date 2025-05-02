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
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer
from collections import defaultdict

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
            SELECT DISTINCT ON (user_id, event_id)
                   user_id, event_id,
                   CASE WHEN action_type = 'interested' THEN 1 ELSE 0 END AS rating
            FROM user_event_interactions
            ORDER BY user_id, event_id, interaction_time DESC;
        """
        df = pd.read_sql_query(query, conn)
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

# Build event content matrix
def build_event_content_matrix(events):
    df = pd.DataFrame(events)

    # Combine relevant features into one string per event
    df['combined'] = (
        df['event_type'].fillna('') + ' ' +
        df['location'].fillna('') + ' ' +
        df['start_time'].fillna('').astype(str)
    )

    vectorizer = TfidfVectorizer()
    content_matrix = vectorizer.fit_transform(df['combined'])

    return content_matrix, df['id'].values

# Recommend events for a user
def recommend_events(user_id, top_n=10):
    logger.info(f"Starting recommendation process for user {user_id}")
    try:
        # Get user preferences
        preferences = get_user_preferences(user_id)
        
        # Get user's interaction data
        df = get_interactions()
        interaction_matrix = build_user_event_matrix(df)

        # Check for cold start scenario
        if user_id not in interaction_matrix.index or interaction_matrix.shape[0] < 2:
            logger.info(f"Cold start for user {user_id}. Ranking by preferences + top events.")

            # Score based on preferences
            events = get_all_events()
            content_scores = defaultdict(float)
            for event in events:
                score = 0
                if preferences.get("eventCategories") and event["event_type"] in preferences["eventCategories"]:
                    score += 1
                if preferences.get("preferredTime") and preferences["preferredTime"] in str(event["start_time"]):
                    score += 0.5
                content_scores[event["id"]] = score

            ranked = pd.Series(content_scores).sort_values(ascending=False)
            return ranked.head(top_n).index.tolist()

        # 1. Collaborative scores
        logger.info(f"Calculating cosine similarity for user-event matrix of shape {interaction_matrix.shape}")
        similarity = cosine_similarity(interaction_matrix)
        logger.info(f"Cosine similarity matrix calculated with shape {similarity.shape}")
        target_idx = interaction_matrix.index.get_loc(user_id)
        user_vecs = interaction_matrix.values
        collab_scores = similarity[target_idx] @ user_vecs
        collab_scores = pd.Series(collab_scores, index=interaction_matrix.columns)

        # 2. Content-based scores from profile
        events = get_all_events()
        content_scores = defaultdict(float)
        for event in events:
            score = 0
            if preferences.get("eventCategories") and event.get("event_type") in preferences["eventCategories"]:
                score += 1
            if preferences.get("preferredTime") and preferences["preferredTime"] in str(event.get("start_time")):
                score += 0.5
            if preferences.get("preferredDistance"):
                score += 0.3  # fake location weighting if not implemented
            # You can add budget, size, etc. here
            content_scores[event["id"]] = score
        content_scores = pd.Series(content_scores)

        # 3. Combine scores — this is your hybrid logic
        combined_scores = 0.7 * collab_scores.add(0, fill_value=0) + 0.3 * content_scores.add(0, fill_value=0)

        # Remove already seen events
        seen_events = set(df[df['user_id'] == user_id]['event_id'])
        recommendations = combined_scores.drop(labels=seen_events, errors='ignore').sort_values(ascending=False).head(top_n)

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

def getGoogleMapsEmbedUrl(location):
    if not location or location == 'Unknown' or location == 'Miesto Neznáme' or location == 'Miesto neznáme':
        # Default to Prešov if location is not provided
        return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2641.8383484567!2d21.2353986!3d48.9977246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473eed62a563a9ef%3A0xb18994e09e7a9e06!2sJarkov%C3%A1%203110%2F77%2C%20080%2001%20Pre%C5%A1ov!5e0!3m2!1ssk!2ssk!4v1709912345678!5m2!1ssk!2ssk"
    
    # Encode the location for use in the URL
    encodedLocation = location.replace(' ', '+')
    
    # Create a Google Maps embed URL with the location
    mapUrl = f"https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q={encodedLocation}&zoom=15"
    
    return mapUrl

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
        
        # If there are no recommended events, return an empty list
        if not recommended_event_ids:
            return jsonify([])

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
        
        # Format the response with proper time handling
        formatted_events = []
        for event in events:
            location = event[3] or 'Miesto Neznáme'
            formatted_event = {
                'id': event[0],
                'title': event[1],
                'category': event[2],
                'location': location,
                'map_url': getGoogleMapsEmbedUrl(location),
                'event_start_date': event[4].strftime('%Y-%m-%d') if event[4] else None,
                'event_end_date': event[5].strftime('%Y-%m-%d') if event[5] else None,
                'start_time': str(event[6]) if event[6] else None,
                'end_time': str(event[7]) if event[7] else None,
                'tickets': event[8],
                'shortText': event[9],
                'link_to': event[10],
                'image': event[11] or 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80'
            }
            formatted_events.append(formatted_event)
        
        return jsonify(formatted_events)
    except Exception as e:
        logger.error(f"Error in recommend endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    logger.info("Starting scikit-learn based recommendation service...")
    app.run(host="0.0.0.0", port=8000, debug=False)

