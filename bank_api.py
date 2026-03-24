
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from datetime import datetime
from repository import (
    get_all_users, create_user,
    get_all_accounts, create_account,
    get_all_transactions, create_transaction
)

app = Flask(__name__)
CORS(app)


# --- User Endpoints ---
@app.route('/api/users', methods=['GET'])
def api_get_users():
    users = get_all_users()
    return jsonify([
        {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "created_at": u.created_at.isoformat() if u.created_at else None
        } for u in users
    ])

@app.route('/api/users', methods=['POST'])
def api_create_user():
    data = request.get_json()
    if not data or "name" not in data or "email" not in data:
        abort(400, description="Missing name or email")
    user = create_user(data["name"], data["email"], datetime.now())
    return jsonify({
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
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
    accounts = get_all_accounts()
    account = next((a for a in accounts if a.account_id == account_id), None)
    if not account:
        abort(404, description="Account not found")
    data = request.get_json()
    amount = data.get("amount", 0)
    if amount <= 0:
        abort(400, description="Deposit amount must be positive")
    account.balance += amount
    # Save transaction
    create_transaction(account_id=account_id, txn_type="DEPOSIT", amount=amount, created_at=datetime.now())
    # Save account update
    # In a real app, you'd commit the session here
    return jsonify({"balance": float(account.balance)})

@app.route('/api/accounts/<int:account_id>/withdraw', methods=['POST'])
def api_withdraw(account_id):
    accounts = get_all_accounts()
    account = next((a for a in accounts if a.account_id == account_id), None)
    if not account:
        abort(404, description="Account not found")
    data = request.get_json()
    amount = data.get("amount", 0)
    if amount <= 0:
        abort(400, description="Withdraw amount must be positive")
    if account.balance < amount:
        abort(400, description="Insufficient balance")
    account.balance -= amount
    create_transaction(account_id=account_id, txn_type="WITHDRAW", amount=amount, created_at=datetime.now())
    # Save account update
    # In a real app, you'd commit the session here
    return jsonify({"balance": float(account.balance)})

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
