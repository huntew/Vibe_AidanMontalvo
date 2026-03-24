from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    created_at = Column(TIMESTAMP)

class Account(Base):
    __tablename__ = "accounts"
    account_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    balance = Column(DECIMAL(10, 2), default=0)
    account_type = Column(String(50))
    created_at = Column(TIMESTAMP)

class Transaction(Base):
    __tablename__ = "transactions"
    txn_id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.account_id"))
    txn_type = Column(String(20))
    amount = Column(DECIMAL(10, 2))
    created_at = Column(TIMESTAMP)
