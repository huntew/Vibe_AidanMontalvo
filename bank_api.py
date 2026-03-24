from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory data stores (matching DB schema)
from datetime import datetime
now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
users = [
    {"user_id": 1, "name": "Alice", "email": "alice@example.com", "created_at": now},
    {"user_id": 2, "name": "Bob", "email": "bob@example.com", "created_at": now}
]
accounts = [
    {"account_id": 1, "user_id": 1, "balance": 1000.0, "account_type": "SAVINGS", "created_at": now},
    {"account_id": 2, "user_id": 2, "balance": 500.0, "account_type": "CHECKING", "created_at": now}
]
transactions = [
    {"txn_id": 1, "account_id": 1, "txn_type": "DEPOSIT", "amount": 1000.0, "created_at": now},
    {"txn_id": 2, "account_id": 2, "txn_type": "DEPOSIT", "amount": 500.0, "created_at": now}
]

# Helper functions

def find_user(user_id):
    return next((u for u in users if u["user_id"] == user_id), None)

def find_account(account_id):
    return next((a for a in accounts if a["account_id"] == account_id), None)

def get_next_id(collection, key):
    return max([item[key] for item in collection], default=0) + 1

# --- User Endpoints (for demo, not in original spec) ---
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or "name" not in data or "email" not in data:
        abort(400, description="Missing name or email")
    user = {
        "user_id": get_next_id(users, "user_id"),
        "name": data["name"],
        "email": data["email"],
        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    users.append(user)
    return jsonify(user), 201

# --- Account Endpoints ---
@app.route('/api/accounts', methods=['POST'])
def create_account():
    data = request.get_json()
    if not data or "user_id" not in data or "account_type" not in data:
        abort(400, description="Missing user_id or account_type")
    user = find_user(data["user_id"])
    if not user:
        abort(404, description="User not found")
    account = {
        "account_id": get_next_id(accounts, "account_id"),
        "user_id": data["user_id"],
        "balance": 0.0,
        "account_type": data["account_type"],
        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    accounts.append(account)
    return jsonify(account), 201

@app.route('/api/accounts/<int:account_id>', methods=['GET'])
def get_account(account_id):
    account = find_account(account_id)
    if not account:
        abort(404, description="Account not found")
    user = find_user(account["user_id"])
    return jsonify({
        "account_id": account["account_id"],
        "user_id": account["user_id"],
        "user_name": user["name"] if user else None,
        "balance": account["balance"],
        "account_type": account["account_type"],
        "created_at": account["created_at"]
    })

@app.route('/api/accounts/<int:account_id>/deposit', methods=['POST'])
def deposit(account_id):
    account = find_account(account_id)
    if not account:
        abort(404, description="Account not found")
    data = request.get_json()
    amount = data.get("amount", 0)
    if amount <= 0:
        abort(400, description="Deposit amount must be positive")
    account["balance"] += amount
    txn = {
        "txn_id": get_next_id(transactions, "txn_id"),
        "account_id": account_id,
        "txn_type": "DEPOSIT",
        "amount": amount,
        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    transactions.append(txn)
    return jsonify({"balance": account["balance"]})

@app.route('/api/accounts/<int:account_id>/withdraw', methods=['POST'])
def withdraw(account_id):
    account = find_account(account_id)
    if not account:
        abort(404, description="Account not found")
    data = request.get_json()
    amount = data.get("amount", 0)
    if amount <= 0:
        abort(400, description="Withdraw amount must be positive")
    if account["balance"] < amount:
        abort(400, description="Insufficient balance")
    account["balance"] -= amount
    txn = {
        "txn_id": get_next_id(transactions, "txn_id"),
        "account_id": account_id,
        "txn_type": "WITHDRAW",
        "amount": amount,
        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    transactions.append(txn)
    return jsonify({"balance": account["balance"]})

@app.route('/api/accounts/<int:account_id>/transactions', methods=['GET'])
def get_transactions(account_id):
    account = find_account(account_id)
    if not account:
        abort(404, description="Account not found")
    txns = [
        {
            "type": t["txn_type"],
            "amount": t["amount"],
            "date": "2026-03-23"  # Static date for demo
        }
        for t in transactions if t["account_id"] == account_id
    ]
    return jsonify(txns)


# Route to create sample data for testing
@app.route('/api/sample-data', methods=['POST'])
def create_sample_data():
    users.clear()
    accounts.clear()
    transactions.clear()
    # Add sample users
    users.append({"user_id": 1, "name": "Alice", "email": "alice@example.com"})
    users.append({"user_id": 2, "name": "Bob", "email": "bob@example.com"})
    # Add sample accounts
    accounts.append({"account_id": 1, "user_id": 1, "balance": 1000.0, "account_type": "SAVINGS"})
    accounts.append({"account_id": 2, "user_id": 2, "balance": 500.0, "account_type": "CHECKING"})
    # Add sample transactions
    transactions.append({"txn_id": 1, "account_id": 1, "txn_type": "DEPOSIT", "amount": 1000.0})
    transactions.append({"txn_id": 2, "account_id": 2, "txn_type": "DEPOSIT", "amount": 500.0})
    return jsonify({"message": "Sample data created."})

if __name__ == '__main__':
    app.run(debug=True)
