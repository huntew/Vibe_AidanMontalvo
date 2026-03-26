# MongoDB does not require ORM models. Data will be stored as dictionaries.
# You can define helper functions or classes if you want to enforce structure.

def user_dict(name, password_hash, role, created_at):
    return {
        "name": name,
        "password_hash": password_hash,
        "role": role,
        "created_at": created_at
    }

def account_dict(user_id, balance, account_type, created_at):
    return {
        "user_id": user_id,
        "balance": balance,
        "account_type": account_type,
        "created_at": created_at
    }

def transaction_dict(account_id, txn_type, amount, created_at):
    return {
        "account_id": account_id,
        "txn_type": txn_type,
        "amount": amount,
        "created_at": created_at
    }
