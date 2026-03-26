from database import db

# Wipe all collections in the bank_db database
collections = ["users", "accounts", "transactions"]
for col in collections:
    db[col].delete_many({})
    print(f"Wiped collection: {col}")

print("All collections wiped!")
