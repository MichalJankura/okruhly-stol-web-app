from flask import Flask, request, jsonify
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import logging
import time
import os
import random
from datetime import datetime, timedelta, UTC
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer
from collections import defaultdict
from math import radians, cos, sin, asin, sqrt

# Tunable weights for hybrid recommendation
CONTENT_WEIGHT = 0.5
COLLAB_WEIGHT = 0.4
POPULAR_WEIGHT = 0.1
DISTANCE_WEIGHT = 0.3  # Weight for distance penalty

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

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth"""
    R = 6371  # Earth radius in km
    
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c

def get_user_location(user_id):
    """Fetch user's location from the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT latitude, longitude FROM users WHERE user_id = %s",
            (user_id,)
        )
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result and result[0] is not None and result[1] is not None:
            return float(result[0]), float(result[1])
        logger.warning(f"No location found for user {user_id}")
        return None, None
    except Exception as e:
        logger.error(f"Error fetching user location: {e}")
        return None, None

def get_event_coordinates(event_ids):
    """Fetch coordinates for multiple events in one query"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        placeholders = ','.join(['%s'] * len(event_ids))
        cursor.execute(
            f"SELECT id, latitude, longitude FROM events WHERE id IN ({placeholders})",
            event_ids
        )
        coords = {id: (lat, lon) for id, lat, lon in cursor.fetchall()}
        cursor.close()
        conn.close()
        return coords
    except Exception as e:
        logger.error(f"Error fetching event coordinates: {e}")
        return {}

def apply_distance_penalty(scores, event_ids, user_lat, user_lon, preferences):
    """Apply distance-based penalty to event scores"""
    if user_lat is None or user_lon is None:
        return scores
        
    # Get max distance from preferences
    preferred_range = preferences.get("preferredDistance", "0-5")
    max_distance_km = {
        "0-5": 5,
        "5-15": 15,
        "15-30": 30,
        "30+": 100
    }.get(preferred_range, 5)
    
    # Get coordinates for all events
    event_coords = get_event_coordinates(event_ids)
    
    # Apply distance penalty to scores
    for event_id in event_ids:
        if event_id in event_coords:
            event_lat, event_lon = event_coords[event_id]
            if event_lat is not None and event_lon is not None:
                try:
                    distance = haversine(user_lat, user_lon, float(event_lat), float(event_lon))
                    distance_penalty = min(distance / max_distance_km, 2.0)  # normalize
                    scores[event_id] -= distance_penalty * DISTANCE_WEIGHT
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error calculating distance for event {event_id}: {e}")
    
    return scores

# Fetch interaction data from database
def get_interactions():
    logger.info("Fetching interaction data from database")
    try:
        conn = get_db_connection()
        query = """
            SELECT DISTINCT ON (user_id, event_id)
                   user_id, event_id,
                   interaction_time,
                   CASE 
                       WHEN action_type = 'interested' THEN 1 
                       WHEN action_type = 'not_interested' THEN -1
                       ELSE 0 
                   END AS rating
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
    user_id = int(user_id)  # Ensure user_id is always an int for indexing
    logger.info(f"Starting recommendation process for user {user_id}")
    try:
        # Get user preferences and location
        preferences = get_user_preferences(user_id)
        user_lat, user_lon = get_user_location(user_id)
        
        # Get user's interaction data
        df = get_interactions()
        interaction_matrix = build_user_event_matrix(df)
        events = get_all_events()
        event_df = pd.DataFrame(events)

        # Check for cold start scenario
        target_idx = interaction_matrix.index.get_loc(user_id) if user_id in interaction_matrix.index else None

        if target_idx is None:
            # Content-based fallback using preferences
            content_scores = []
            for _, event in event_df.iterrows():
                score = 0
                if preferences.get("eventCategories") and event["event_type"] in preferences["eventCategories"]:
                    score += 1
                if preferences.get("preferredTime") and preferences["preferredTime"] in str(event["start_time"]):
                    score += 0.5
                content_scores.append(score)
            content_scores = pd.Series(content_scores, index=event_df["id"])

            def normalize(series):
                return (series - series.min()) / (series.max() - series.min()) if series.max() != series.min() else series

            content_scores_norm = normalize(content_scores)
            scores_dict = content_scores_norm.to_dict()
        else:
            similarity = cosine_similarity(interaction_matrix)
            collab_scores = similarity[target_idx] @ interaction_matrix.values
            collab_scores = pd.Series(collab_scores, index=interaction_matrix.columns)

            # Custom score based on preferences
            content_scores = []
            for _, event in event_df.iterrows():
                score = 0
                if preferences.get("eventCategories") and event["event_type"] in preferences["eventCategories"]:
                    score += 1
                if preferences.get("preferredTime") and preferences["preferredTime"] in str(event["start_time"]):
                    score += 0.5
                content_scores.append(score)
            content_scores = pd.Series(content_scores, index=event_df["id"])

            # Popularity score - interaction count
            event_interaction_counts = df[df['rating'] > 0]["event_id"].value_counts()  # Only count positive interactions
            popular_scores = pd.Series(0, index=collab_scores.index)
            for event_id, count in event_interaction_counts.items():
                if event_id in popular_scores:
                    popular_scores[event_id] = count

            # Score normalization
            def normalize(series):
                return (series - series.min()) / (series.max() - series.min()) if series.max() != series.min() else series

            collab_scores_norm = normalize(collab_scores)
            content_scores_norm = normalize(content_scores)
            popular_scores_norm = normalize(popular_scores)

            combined_scores = (
                COLLAB_WEIGHT * collab_scores_norm +
                CONTENT_WEIGHT * content_scores_norm +
                POPULAR_WEIGHT * popular_scores_norm
            )

            scores_dict = combined_scores.to_dict()
            recommendations = event_df.to_dict(orient="records")

        # Apply distance penalty to scores
        if user_lat is not None and user_lon is not None:
            scores_dict = apply_distance_penalty(scores_dict, list(scores_dict.keys()), user_lat, user_lon, preferences)
            
            # Get current time and threshold for recent interactions
            now = datetime.now().replace(tzinfo=None)  # make naive datetime
            recent_threshold = now - timedelta(minutes=2)

            # Ensure interaction_time is datetime
            df['interaction_time'] = pd.to_datetime(df['interaction_time'], errors='coerce')

            # Filter events
            filtered_ids = df[
                (df['user_id'] == user_id) &
                (
                    (df['rating'] == -1) |
                    ((df['rating'] == 1) & (df['interaction_time'] > recent_threshold))
                )
            ]['event_id'].tolist()

            # Exclude filtered
            scores_dict = {k: v for k, v in scores_dict.items() if k not in filtered_ids}
            
            # Sort by final scores and get top N
            recommended_ids = sorted(scores_dict.keys(), key=lambda x: scores_dict[x], reverse=True)[:top_n]
        else:
            # If no location data, just sort by scores
            # Get current time and threshold for recent interactions
            now = datetime.now(UTC)
            recent_threshold = now - timedelta(minutes=2)

            # Exclude events that are:
            # - marked as "not_interested" (rating -1), or
            # - marked as "interested" very recently (within last 2 minutes)
            df['interaction_time'] = pd.to_datetime(df.get('interaction_time'), errors='coerce')  # safe datetime parsing

            filtered_ids = df[
                (df['user_id'] == user_id) &
                (
                    (df['rating'] == -1) |
                    ((df['rating'] == 1) & (df['interaction_time'] > recent_threshold))
                )
            ]['event_id'].tolist()

            scores_dict = {k: v for k, v in scores_dict.items() if k not in filtered_ids}
            
            recommended_ids = sorted(scores_dict.keys(), key=lambda x: scores_dict[x], reverse=True)[:top_n]

        logger.info(f"Generated {len(recommended_ids)} recommendations for user {user_id}")
        return recommended_ids
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

