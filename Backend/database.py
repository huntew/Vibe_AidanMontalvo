
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()


# Load MongoDB URI from environment variable only (no default, to avoid secrets in code)
MONGODB_ATLAS_URI = os.getenv("MONGODB_ATLAS_URI")
if not MONGODB_ATLAS_URI:
    raise RuntimeError("MONGODB_ATLAS_URI environment variable not set. Please set it to your MongoDB connection string.")

client = MongoClient(MONGODB_ATLAS_URI)
db = client.get_default_database()  # Database name must be in the URI
