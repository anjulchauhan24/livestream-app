from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'rtsp_livestream')

print("=" * 50)
print("Flask Backend Starting...")
print("=" * 50)
print(f"Database: {DATABASE_NAME}")
if MONGO_URI:
    masked_uri = MONGO_URI.split('@')[0].split(':')[0] + ':****@' + MONGO_URI.split('@')[1] if '@' in MONGO_URI else MONGO_URI[:30]
    print(f"MongoDB URI: {masked_uri}")
else:
    print("WARNING: MONGO_URI not found in .env")
print("=" * 50)

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
overlays_collection = db['overlays']

# Helper function to serialize MongoDB documents
def serialize_overlay(overlay):
    overlay['_id'] = str(overlay['_id'])
    return overlay

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        client.admin.command('ping')
        db_status = 'connected'
    except:
        db_status = 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'message': 'API is running'
    }), 200

# CREATE - Add a new overlay
@app.route('/api/overlays', methods=['POST'])
def create_overlay():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'content', 'position', 'size']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        overlay = {
            'type': data['type'],  # 'text' or 'logo'
            'content': data['content'],  # text string or image URL
            'position': {
                'x': data['position'].get('x', 0),
                'y': data['position'].get('y', 0)
            },
            'size': {
                'width': data['size'].get('width', 100),
                'height': data['size'].get('height', 50)
            },
            'style': data.get('style', {}),  # Additional styling options
            'isVisible': data.get('isVisible', True)
        }
        
        result = overlays_collection.insert_one(overlay)
        overlay['_id'] = str(result.inserted_id)
        
        print(f"✓ Created overlay: {overlay['type']} - {overlay['content'][:30]}")
        
        return jsonify({
            'message': 'Overlay created successfully',
            'overlay': overlay
        }), 201
        
    except Exception as e:
        print(f"✗ Error creating overlay: {str(e)}")
        return jsonify({'error': str(e)}), 500

# READ - Get all overlays
@app.route('/api/overlays', methods=['GET'])
def get_overlays():
    try:
        overlays = list(overlays_collection.find())
        serialized_overlays = [serialize_overlay(overlay) for overlay in overlays]
        return jsonify({'overlays': serialized_overlays}), 200
    except Exception as e:
        print(f"✗ Error getting overlays: {str(e)}")
        return jsonify({'error': str(e)}), 500

# READ - Get a single overlay by ID
@app.route('/api/overlays/<overlay_id>', methods=['GET'])
def get_overlay(overlay_id):
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({'error': 'Invalid overlay ID'}), 400
        
        overlay = overlays_collection.find_one({'_id': ObjectId(overlay_id)})
        
        if not overlay:
            return jsonify({'error': 'Overlay not found'}), 404
        
        return jsonify({'overlay': serialize_overlay(overlay)}), 200
    except Exception as e:
        print(f"✗ Error getting overlay: {str(e)}")
        return jsonify({'error': str(e)}), 500

# UPDATE - Update an existing overlay
@app.route('/api/overlays/<overlay_id>', methods=['PUT'])
def update_overlay(overlay_id):
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({'error': 'Invalid overlay ID'}), 400
        
        data = request.get_json()
        
        update_data = {}
        if 'type' in data:
            update_data['type'] = data['type']
        if 'content' in data:
            update_data['content'] = data['content']
        if 'position' in data:
            update_data['position'] = data['position']
        if 'size' in data:
            update_data['size'] = data['size']
        if 'style' in data:
            update_data['style'] = data['style']
        if 'isVisible' in data:
            update_data['isVisible'] = data['isVisible']
        
        result = overlays_collection.update_one(
            {'_id': ObjectId(overlay_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Overlay not found'}), 404
        
        updated_overlay = overlays_collection.find_one({'_id': ObjectId(overlay_id)})
        
        print(f"✓ Updated overlay: {overlay_id}")
        
        return jsonify({
            'message': 'Overlay updated successfully',
            'overlay': serialize_overlay(updated_overlay)
        }), 200
        
    except Exception as e:
        print(f"✗ Error updating overlay: {str(e)}")
        return jsonify({'error': str(e)}), 500

# DELETE - Delete an overlay
@app.route('/api/overlays/<overlay_id>', methods=['DELETE'])
def delete_overlay(overlay_id):
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({'error': 'Invalid overlay ID'}), 400
        
        result = overlays_collection.delete_one({'_id': ObjectId(overlay_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Overlay not found'}), 404
        
        print(f"✓ Deleted overlay: {overlay_id}")
        
        return jsonify({'message': 'Overlay deleted successfully'}), 200
        
    except Exception as e:
        print(f"✗ Error deleting overlay: {str(e)}")
        return jsonify({'error': str(e)}), 500

# RTSP Settings endpoints
@app.route('/api/settings/rtsp', methods=['GET', 'POST'])
def rtsp_settings():
    settings_collection = db['settings']
    
    if request.method == 'GET':
        try:
            settings = settings_collection.find_one({'type': 'rtsp'})
            if settings:
                settings['_id'] = str(settings['_id'])
                return jsonify({'settings': settings}), 200
            else:
                return jsonify({'settings': None}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            rtsp_url = data.get('rtspUrl')
            
            if not rtsp_url:
                return jsonify({'error': 'RTSP URL is required'}), 400
            
            settings = {
                'type': 'rtsp',
                'rtspUrl': rtsp_url
            }
            
            # Upsert: update if exists, insert if not
            result = settings_collection.update_one(
                {'type': 'rtsp'},
                {'$set': settings},
                upsert=True
            )
            
            print(f"✓ RTSP URL saved: {rtsp_url[:50]}")
            
            return jsonify({
                'message': 'RTSP settings saved successfully',
                'settings': settings
            }), 200
            
        except Exception as e:
            print(f"✗ Error saving RTSP settings: {str(e)}")
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    print(f"\n🚀 Starting Flask server on port {PORT}...")
    print(f"📍 API will be available at: http://localhost:{PORT}/api")
    print("Press CTRL+C to quit\n")
    app.run(debug=True, host='0.0.0.0', port=PORT)