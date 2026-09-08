from pymongo import MongoClient
from config import MONGODB_URI, MONGODB_DB_NAME

client = None
db = None
_connection_attempted = False

def get_database():
    global client, db, _connection_attempted
    if _connection_attempted:
        return db

    _connection_attempted = True
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=500)
        # Test connection with ping
        client.admin.command('ping')
        db = client[MONGODB_DB_NAME]
        print("Successfully connected to MongoDB.")
    except Exception as e:
        print(f"MongoDB offline/unreachable: {e}. Active with high-performance in-memory store.")
        client = None
        db = None

    return db


