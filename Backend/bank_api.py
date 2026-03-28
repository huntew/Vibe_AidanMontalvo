import logging
#logging.basicConfig(level=logging.DEBUG)

from flask import Flask, jsonify, request, abort
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import datetime

from repository import (
    get_all_users, create_user, get_user_by_name,
    get_all_accounts, create_account,
    get_all_transactions, create_transaction
)
from models import user_dict, account_dict, transaction_dict
from database import db
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # TODO: Use a secure key or load from env
jwt = JWTManager(app)

# --- User Endpoints ---



# Registration endpoint (name and password only)
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    required = ["name", "password"]
    if not data or not all(k in data for k in required):
        abort(400, description="Missing required fields")
    password_hash = generate_password_hash(data["password"])
    user = create_user(
        name=data["name"],
        password_hash=password_hash,
        role=data.get("role", "customer"),
        created_at=datetime.now()
    )
    return jsonify({
        "user_id": str(user.get("_id")),
        "role": user.get("role"),
        "name": user.get("name"),
        "created_at": user.get("created_at")
    }), 201



# Login endpoint (name and password only)
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data or "name" not in data or "password" not in data:
        abort(400, description="Missing name or password")
    user = get_user_by_name(data["name"])
    if not user or not check_password_hash(user["password_hash"], data["password"]):
        abort(401, description="Invalid name or password")
    access_token = create_access_token(identity=str(user.get("_id")))
    return jsonify({
        "access_token": access_token,
        "user_id": str(user.get("_id")),
        "role": user.get("role"),
        "name": user.get("name"),
        "created_at": user.get("created_at")
    })
# --- User Endpoints ---


@app.route('/api/users', methods=['GET'])
def api_get_users():
    users = get_all_users()
    return jsonify([
        {
            "user_id": str(u.get("_id")),
            "name": u.get("name"),
            "role": u.get("role"),
            "created_at": u.get("created_at")
        } for u in users
    ])



@app.route('/api/users', methods=['POST'])
def api_create_user():
    data = request.get_json()
    if not data or "name" not in data:
        abort(400, description="Missing name")
    user = create_user(
        name=data["name"],
        password_hash="",  # No password set via this endpoint
        role=data.get("role", "customer"),
        created_at=datetime.now()
    )
    return jsonify({
        "user_id": str(user.get("_id")),
        "name": user.get("name"),
        "role": user.get("role"),
        "created_at": user.get("created_at")
    }), 201


# --- Account Endpoints ---
@app.route('/api/accounts', methods=['GET'])
@jwt_required()
def api_get_accounts():
    accounts = get_all_accounts()
    return jsonify([
        {
            "account_id": str(a.get("_id")),
            "user_id": a.get("user_id"),
            "balance": float(a.get("balance", 0)),
            "account_type": a.get("account_type"),
            "created_at": a.get("created_at")
        } for a in accounts
    ])

@app.route('/api/accounts', methods=['POST'])
@jwt_required()
def api_create_account():
    data = request.get_json()
    if not data or "user_id" not in data or "account_type" not in data:
        abort(400, description="Missing user_id or account_type")
    balance = data.get("balance", 0)
    # Validate balance has at most two decimal places
    if isinstance(balance, float) or isinstance(balance, int):
        if balance < 0:
            abort(400, description="Balance must be non-negative")
        if round(balance * 100) != balance * 100:
            abort(400, description="Balance cannot have more than two decimal places")
    account = create_account(
        user_id=data["user_id"],
        balance=balance,
        account_type=data["account_type"],
        created_at=datetime.now().isoformat()
    )
    return jsonify({
        "account_id": str(account.get("_id")),
        "user_id": account.get("user_id"),
        "balance": float(account.get("balance", 0)),
        "account_type": account.get("account_type"),
        "created_at": account.get("created_at")
    }), 201

@app.route('/api/accounts/<account_id>', methods=['GET'])
@jwt_required()
def api_get_account(account_id):
    from bson import ObjectId
    account = db["accounts"].find_one({"_id": ObjectId(account_id)})
    if not account:
        abort(404, description="Account not found")
    return jsonify({
        "account_id": str(account.get("_id")),
        "user_id": account.get("user_id"),
        "balance": float(account.get("balance", 0)),
        "account_type": account.get("account_type"),
        "created_at": account.get("created_at")
    })


@app.route('/api/accounts/<account_id>/deposit', methods=['POST'])
@jwt_required()
def api_deposit(account_id):
    from bson import ObjectId
    account = db["accounts"].find_one({"_id": ObjectId(account_id)})
    if not account:
        abort(404, description="Account not found")
    data = request.get_json()
    amount = data.get("amount", 0)
    if amount <= 0:
        abort(400, description="Deposit amount must be positive")
    # Validate amount has at most two decimal places
    if round(amount * 100) != amount * 100:
        abort(400, description="Deposit amount cannot have more than two decimal places")
    new_balance = float(account.get("balance", 0)) + amount
    db["accounts"].update_one({"_id": ObjectId(account_id)}, {"$set": {"balance": new_balance}})
    create_transaction(account_id=str(account_id), txn_type="DEPOSIT", amount=amount, created_at=datetime.now().isoformat())
    return jsonify({"balance": new_balance})


@app.route('/api/accounts/<account_id>/withdraw', methods=['POST'])
@jwt_required()
def api_withdraw(account_id):
    from bson import ObjectId
    account = db["accounts"].find_one({"_id": ObjectId(account_id)})
    if not account:
        abort(404, description="Account not found")
    data = request.get_json()
    amount = data.get("amount", 0)
    if amount <= 0:
        abort(400, description="Withdraw amount must be positive")
    # Validate amount has at most two decimal places
    if round(amount * 100) != amount * 100:
        abort(400, description="Withdraw amount cannot have more than two decimal places")
    if float(account.get("balance", 0)) < amount:
        abort(400, description="Insufficient balance")
    new_balance = float(account.get("balance", 0)) - amount
    db["accounts"].update_one({"_id": ObjectId(account_id)}, {"$set": {"balance": new_balance}})
    create_transaction(account_id=str(account_id), txn_type="WITHDRAW", amount=amount, created_at=datetime.now().isoformat())
    return jsonify({"balance": new_balance})

@app.route('/api/accounts/<account_id>/transactions', methods=['GET'])
@jwt_required()
def api_get_transactions(account_id):
    from bson import ObjectId
    account = db["accounts"].find_one({"_id": ObjectId(account_id)})
    if not account:
        abort(404, description="Account not found")
    txns = [
        {
            "txn_id": str(t.get("_id")),
            "txn_type": t.get("txn_type"),
            "amount": float(t.get("amount", 0)),
            "created_at": t.get("created_at")
        }
        for t in db["transactions"].find({"account_id": str(account_id)})
    ]
    return jsonify(txns)



# (Optional) You can add a sample-data endpoint that inserts demo data into the database using repository functions if needed.

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
