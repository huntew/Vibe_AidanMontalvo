
from database import db
from models import user_dict, account_dict, transaction_dict

def get_all_users():
    return list(db["users"].find())

def get_user_by_name(name):
    return db["users"].find_one({"name": name})

def create_user(name, password_hash, role, created_at):
    user = user_dict(name, password_hash, role, created_at)
    result = db["users"].insert_one(user)
    user["_id"] = result.inserted_id
    return user

def get_all_accounts():
    return list(db["accounts"].find())

def create_account(user_id, balance, account_type, created_at):
    account = account_dict(user_id, balance, account_type, created_at)
    result = db["accounts"].insert_one(account)
    account["_id"] = result.inserted_id
    return account

def get_all_transactions():
    return list(db["transactions"].find())

def create_transaction(account_id, txn_type, amount, created_at):
    txn = transaction_dict(account_id, txn_type, amount, created_at)
    result = db["transactions"].insert_one(txn)
    txn["_id"] = result.inserted_id
    return txn
