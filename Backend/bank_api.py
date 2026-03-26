import logging
logging.basicConfig(level=logging.DEBUG)

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from datetime import datetime
from repository import (
    get_all_users, create_user, get_user_by_name,
    get_all_accounts, create_account,
    get_all_transactions, create_transaction
)
import models
from database import SessionLocal
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

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
        "user_id": user.user_id,
        "role": user.role,
        "name": user.name,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 201



# Login endpoint (name and password only)
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data or "name" not in data or "password" not in data:
        abort(400, description="Missing name or password")
    user = get_user_by_name(data["name"])
    if not user or not check_password_hash(user.password_hash, data["password"]):
        abort(401, description="Invalid name or password")
    return jsonify({
        "user_id": user.user_id,
        "role": user.role,
        "name": user.name,
        "created_at": user.created_at.isoformat() if user.created_at else None
    })
# --- User Endpoints ---


@app.route('/api/users', methods=['GET'])
def api_get_users():
    users = get_all_users()
    return jsonify([
        {
            "user_id": u.user_id,
            "name": u.name,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None
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
        "user_id": user.user_id,
        "name": user.name,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 201


# --- Account Endpoints ---
@app.route('/api/accounts', methods=['GET'])
def api_get_accounts():
    accounts = get_all_accounts()
    return jsonify([
        {
            "account_id": a.account_id,
            "user_id": a.user_id,
            "balance": float(a.balance),
            "account_type": a.account_type,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in accounts
    ])

@app.route('/api/accounts', methods=['POST'])
def api_create_account():
    data = request.get_json()
    if not data or "user_id" not in data or "account_type" not in data:
        abort(400, description="Missing user_id or account_type")
    account = create_account(
        user_id=data["user_id"],
        balance=data.get("balance", 0),
        account_type=data["account_type"],
        created_at=datetime.now()
    )
    return jsonify({
        "account_id": account.account_id,
        "user_id": account.user_id,
        "balance": float(account.balance),
        "account_type": account.account_type,
        "created_at": account.created_at.isoformat() if account.created_at else None
    }), 201

@app.route('/api/accounts/<int:account_id>', methods=['GET'])
def api_get_account(account_id):
    accounts = get_all_accounts()
    account = next((a for a in accounts if a.account_id == account_id), None)
    if not account:
        abort(404, description="Account not found")
    return jsonify({
        "account_id": account.account_id,
        "user_id": account.user_id,
        "balance": float(account.balance),
        "account_type": account.account_type,
        "created_at": account.created_at.isoformat() if account.created_at else None
    })


@app.route('/api/accounts/<int:account_id>/deposit', methods=['POST'])
def api_deposit(account_id):
    db = SessionLocal()
    try:
        account = db.query(models.Account).filter_by(account_id=account_id).first()
        if not account:
            abort(404, description="Account not found")
        data = request.get_json()
        amount = data.get("amount", 0)
        if amount <= 0:
            abort(400, description="Deposit amount must be positive")
        account.balance += amount
        db.commit()
        create_transaction(account_id=account_id, txn_type="DEPOSIT", amount=amount, created_at=datetime.now())
        return jsonify({"balance": float(account.balance)})
    finally:
        db.close()


@app.route('/api/accounts/<int:account_id>/withdraw', methods=['POST'])
def api_withdraw(account_id):
    db = SessionLocal()
    try:
        account = db.query(models.Account).filter_by(account_id=account_id).first()
        if not account:
            abort(404, description="Account not found")
        data = request.get_json()
        amount = data.get("amount", 0)
        if amount <= 0:
            abort(400, description="Withdraw amount must be positive")
        if account.balance < amount:
            abort(400, description="Insufficient balance")
        account.balance -= amount
        db.commit()
        create_transaction(account_id=account_id, txn_type="WITHDRAW", amount=amount, created_at=datetime.now())
        return jsonify({"balance": float(account.balance)})
    finally:
        db.close()

@app.route('/api/accounts/<int:account_id>/transactions', methods=['GET'])
def api_get_transactions(account_id):
    accounts = get_all_accounts()
    account = next((a for a in accounts if a.account_id == account_id), None)
    if not account:
        abort(404, description="Account not found")
    txns = [
        {
            "txn_id": t.txn_id,
            "txn_type": t.txn_type,
            "amount": float(t.amount),
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in get_all_transactions() if t.account_id == account_id
    ]
    return jsonify(txns)



# (Optional) You can add a sample-data endpoint that inserts demo data into the database using repository functions if needed.

if __name__ == '__main__':
    app.run(debug=True)
