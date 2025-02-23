import os
from flask import Flask, render_template, request, jsonify
import json
from werkzeug.utils import secure_filename
import base64

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key")

# Store listings in memory (would use database in production)
LISTINGS = []

UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html', listings=LISTINGS)

@app.route('/api/listings', methods=['GET'])
def get_listings():
    pet_type = request.args.get('type', 'all')
    search_text = request.args.get('search', '').lower()

    filtered = LISTINGS
    if pet_type != 'all':
        filtered = [l for l in filtered if l['pet_type'].lower() == pet_type.lower()]
    if search_text:
        filtered = [l for l in filtered if 
            search_text in l['location']['district'].lower() or
            search_text in l['location']['street'].lower() or
            search_text in l['location']['house'].lower()
        ]

    return jsonify(filtered)

@app.route('/api/listings', methods=['POST'])
def create_listing():
    data = request.form.to_dict()

    # Create location dictionary
    location = {
        'district': data.pop('district', ''),
        'street': data.pop('street', ''),
        'house': data.pop('house', '')
    }
    data['location'] = location

    # Handle image upload
    if 'photo' in request.files:
        photo = request.files['photo']
        if photo:
            # Convert to base64 for simple storage
            photo_data = base64.b64encode(photo.read()).decode('utf-8')
            data['photo'] = photo_data

    LISTINGS.append(data)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)