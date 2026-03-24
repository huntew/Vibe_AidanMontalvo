from models import User, Account, Transaction
from database import SessionLocal

def get_all_users():
    db = SessionLocal()
    try:
        return db.query(User).all()
    finally:
        db.close()

def get_all_accounts():
    db = SessionLocal()
    try:
        return db.query(Account).all()
    finally:
        db.close()

def get_all_transactions():
    db = SessionLocal()
    try:
        return db.query(Transaction).all()
    finally:
        db.close()

def create_user(name, email, created_at):
    db = SessionLocal()
    user = User(name=name, email=email, created_at=created_at)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user

def create_account(user_id, balance, account_type, created_at):
    db = SessionLocal()
    account = Account(user_id=user_id, balance=balance, account_type=account_type, created_at=created_at)
    db.add(account)
    db.commit()
    db.refresh(account)
    db.close()
    return account

def create_transaction(account_id, txn_type, amount, created_at):
    db = SessionLocal()
    txn = Transaction(account_id=account_id, txn_type=txn_type, amount=amount, created_at=created_at)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    db.close()
    return txn
