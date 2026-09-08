from pymongo import MongoClient
from config import MONGODB_URI, MONGODB_DB_NAME

client = None
db = None

def get_database():
    global client, db
    if db is None:
        try:
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
            db = client[MONGODB_DB_NAME]
            # Test connection
            client.admin.command('ping')
            print("Successfully connected to MongoDB.")
        except Exception as e:
            print(f"MongoDB connection warning: {e}. Running with in-memory fallback.")
            db = None
    return db

