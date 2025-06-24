from flask import Flask, request, jsonify
from flask_cors import CORS
from kafka import KafkaProducer
from werkzeug.security import generate_password_hash, check_password_hash
import redis
import json
import logging
import atexit

app = Flask(__name__)
CORS(app)

# Logger setup
logging.basicConfig(level=logging.INFO)

# Redis setup
r = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

# Kafka setup
KAFKA_TOPIC = "events"
producer = None
try:
    # Koristi ime Kafka servisa iz docker-compose.yml, npr. 'kafka'
    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8')
    )
    app.logger.info("Kafka producer initialized successfully.")
except Exception as e:
    app.logger.error(f"Kafka connection failed: {e}")

# Kafka shutdown
@atexit.register
def shutdown():
    if producer:
        producer.close()
        app.logger.info("Kafka producer closed.")

# Tajni token za autorizaciju
SECRET_TOKEN = "tajni_token_za_prijavljene"

# ------------------ ROUTES ------------------

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    if r.hexists("users", username):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    r.hset("users", username, hashed_password)
    return jsonify({"message": "Registration successful"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    stored_password = r.hget("users", username)
    if stored_password and check_password_hash(stored_password, password):
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"message": "Invalid credentials"}), 401


@app.route('/send_event', methods=['POST'])
def send_event():
    data = request.get_json()

    if not data.get('event_name'):
        return jsonify({"message": "Event name is required"}), 400

    try:
        # Provjera da li događaj već postoji u Redis-u prije slanja
        existing_events = r.lrange("events", 0, -1)
        existing_event_ids = [json.loads(event).get('event_name') for event in existing_events]

        if data.get('event_name') in existing_event_ids:
            return jsonify({"message": "Event already exists"}), 400  # Događaj već postoji

        if producer:
            producer.send(KAFKA_TOPIC, data)
            producer.flush()

        # Pošaljite događaj u Redis
        r.lpush("events", json.dumps(data))

        return jsonify({"message": "Event sent"}), 200
    except Exception as e:
        app.logger.error(f"Error sending event: {str(e)}")
        return jsonify({"message": f"Error sending event: {str(e)}"}), 500


@app.route('/get_events', methods=['GET'])
def get_events():
    try:
        events = [json.loads(e) for e in r.lrange("events", 0, -1)]
        return jsonify(events), 200
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

        # Učitaj događaje u Redis, provjeravaj duplikate
        existing_events = r.lrange("events", 0, -1)
        existing_event_ids = [json.loads(event).get('event_name') for event in existing_events]

        for line in events_data:
            try:
                event = json.loads(line.strip())  # Pretvori svaku liniju u JSON
                if event.get('event_name') not in existing_event_ids:
                    r.lpush("events", json.dumps(event))  # Pošaljite događaj u Redis
            except json.JSONDecodeError:
                continue  # Ako se desi greška u dekodiranju, preskoči tu liniju

        return jsonify({"message": "Events loaded into Redis successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error loading events from file: {str(e)}")
        return jsonify({"message": f"Error loading events from file: {str(e)}"}), 500

# Nova ruta za brisanje događaja sa autorizacijom
@app.route('/delete_event', methods=['POST'])
def delete_event():
    auth_header = request.headers.get('Authorization')
    if auth_header != f"Bearer {SECRET_TOKEN}":
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()
    event_name = data.get('event_name')
    if not event_name:
        return jsonify({"message": "Event name is required"}), 400

    try:
        # Dohvati sve događaje
        events = r.lrange("events", 0, -1)
        removed = False

        for event_json in events:
            event = json.loads(event_json)
            if event.get('event_name') == event_name:
                # Ukloni točnu vrijednost iz Redis liste
                r.lrem("events", 1, event_json)
                removed = True
                break

        if removed:
            return jsonify({"message": f"Događaj '{event_name}' je obrisan."}), 200
        else:
            return jsonify({"message": "Događaj nije pronađen."}), 404

    except Exception as e:
        app.logger.error(f"Error deleting event: {str(e)}")
        return jsonify({"message": f"Error deleting event: {str(e)}"}), 500


@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"message": "Route not found"}), 404

# --------------------------------------------

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
