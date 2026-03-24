

from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory data store for demonstration
items = [
	{"id": 1, "name": "Item 1", "description": "First item"},
	{"id": 2, "name": "Item 2", "description": "Second item"}
]

def find_item(item_id):
	return next((item for item in items if item["id"] == item_id), None)

@app.route('/')
def home():
	return jsonify({"message": "Welcome to the Flask API!"})

# Get all items
@app.route('/items', methods=['GET'])
def get_all_items():
	return jsonify(items)

# Get item by id
@app.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
	item = find_item(item_id)
	if item:
		return jsonify(item)
	else:
		abort(404, description="Item not found")

# Create new item
@app.route('/items', methods=['POST'])
def create_item():
	data = request.get_json()
	if not data or "name" not in data:
		abort(400, description="Missing 'name' in request body")
	new_id = max([item["id"] for item in items], default=0) + 1
	new_item = {
		"id": new_id,
		"name": data["name"],
		"description": data.get("description", "")
	}
	items.append(new_item)
	return jsonify(new_item), 201

# Update item (full update)
@app.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
	item = find_item(item_id)
	if not item:
		abort(404, description="Item not found")
	data = request.get_json()
	if not data or "name" not in data:
		abort(400, description="Missing 'name' in request body")
	item["name"] = data["name"]
	item["description"] = data.get("description", "")
	return jsonify(item)

# Patch item (partial update)
@app.route('/items/<int:item_id>', methods=['PATCH'])
def patch_item(item_id):
	item = find_item(item_id)
	if not item:
		abort(404, description="Item not found")
	data = request.get_json()
	if not data:
		abort(400, description="No data provided for patch")
	item.update({k: v for k, v in data.items() if k in item})
	return jsonify(item)

# Delete item
@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
	item = find_item(item_id)
	if not item:
		abort(404, description="Item not found")
	items.remove(item)
	return jsonify({"message": f"Item {item_id} deleted"})

if __name__ == '__main__':
	app.run(debug=True)
