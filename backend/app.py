from flask import Flask, request, jsonify
from flask_cors import CORS
from kafka import KafkaProducer
from werkzeug.security import generate_password_hash, check_password_hash
import redis
import json
import logging
import atexit

app = Flask(__name__)

#  Omogući CORS za tvoj frontend
CORS(app, resources={r"/*": {"origins": "http://158.179.216.162:3000"}}, supports_credentials=True)

logging.basicConfig(level=logging.INFO)

# Redis setup
r = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

# Kafka setup
KAFKA_TOPIC = "events"
producer = None
try:
    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8')
    )
    app.logger.info("Kafka producer initialized successfully.")
except Exception as e:
    app.logger.error(f"Kafka connection failed: {e}")

@atexit.register
def shutdown():
    if producer:
        producer.close()
        app.logger.info("Kafka producer closed.")

SECRET_TOKEN = "tajni_token_za_prijavljene"

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    if r.hexists("users", username):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    user_data = {
        "password": hashed_password,
        "role": role
    }
    r.hset("users", username, json.dumps(user_data))
    return jsonify({"message": "Registration successful"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('email')
    password = data.get('password')

    app.logger.info(f"Prijava pokušaj: {username=}, {password=}")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    stored_data = r.hget("users", username)
    app.logger.info(f"Podaci iz redis za korisnika: {stored_data}")

    if stored_data:
        user = json.loads(stored_data)
        if check_password_hash(user["password"], password):
            app.logger.info("Lozinka ispravna, prijava uspješna")
            return jsonify({"message": "Login successful", "role": user.get("role", "user")}), 200
        else:
            app.logger.info("Lozinka nije ispravna")
    else:
        app.logger.info("Korisnik nije pronađen")

    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/send_event', methods=['POST'])
def send_event():
    data = request.get_json()
    if not data.get('title'):
        return jsonify({"message": "Event title is required"}), 400
    try:
        existing_events = r.lrange("events", 0, -1)
        existing_event_titles = [json.loads(event).get('title') for event in existing_events]
        if data.get('title') in existing_event_titles:
            return jsonify({"message": "Event already exists"}), 400
        if producer:
            producer.send(KAFKA_TOPIC, data)
            producer.flush()
        r.lpush("events", json.dumps(data))
        return jsonify({"message": "Event sent"}), 200
    except Exception as e:
        app.logger.error(f"Error sending event: {str(e)}")
        return jsonify({"message": f"Error sending event: {str(e)}"}), 500

@app.route('/get_events', methods=['GET'])
def get_events():
    try:
        raw_events = r.lrange("events", 0, -1)
        parsed_events = []
        for idx, event_json in enumerate(raw_events):
            event = json.loads(event_json)
            parsed_events.append({
                "id": idx + 1,
                "title": event.get("title", "Bez naslova"),
                "image": event.get("image", ""),
                "description": event.get("description", "")
            })
        return jsonify(parsed_events), 200
    except Exception as e:
        app.logger.error(f"Error retrieving events: {str(e)}")
        return jsonify({"message": f"Error retrieving events: {str(e)}"}), 500

@app.route('/api/events', methods=['GET'])
def api_events():
    return get_events()

@app.route('/load_events', methods=['GET'])
def load_events():
    try:
        with open('events.txt', 'r') as file:
            events_data = file.readlines()
        existing_events = r.lrange("events", 0, -1)
        existing_event_titles = [json.loads(event).get('title') for event in existing_events]
        for line in events_data:
            try:
                event = json.loads(line.strip())
                if event.get('title') not in existing_event_titles:
                    r.lpush("events", json.dumps(event))
            except json.JSONDecodeError:
                continue
        return jsonify({"message": "Events loaded into Redis successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error loading events from file: {str(e)}")
        return jsonify({"message": f"Error loading events from file: {str(e)}"}), 500

@app.route('/delete_event', methods=['POST'])
def delete_event():
    auth_header = request.headers.get('Authorization')
    if auth_header != f"Bearer {SECRET_TOKEN}":
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()
    title = data.get('title')
    if not title:
        return jsonify({"message": "Event title is required"}), 400
    try:
        events = r.lrange("events", 0, -1)
        removed = False
        for event_json in events:
            event = json.loads(event_json)
            if event.get('title') == title:
                r.lrem("events", 1, event_json)
                removed = True
                break
        if removed:
            return jsonify({"message": f"Događaj '{title}' je obrisan."}), 200
        else:
            return jsonify({"message": "Događaj nije pronađen."}), 404
    except Exception as e:
        app.logger.error(f"Error deleting event: {str(e)}")
        return jsonify({"message": f"Error deleting event: {str(e)}"}), 500

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"message": "Route not found"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
