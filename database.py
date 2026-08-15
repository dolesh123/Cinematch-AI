import os
import logging
from pymongo import MongoClient
import mongomock
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("cinematch.database")

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://dolesh123:dolesh123@cluster0.pww0cdb.mongodb.net/?appName=Cluster0")
DB_NAME = os.getenv("MONGO_DB_NAME", "cinematch")

try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=True)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4', '1.1.1.1']
except Exception:
    pass

_client = None
_db = None

def get_database():
    """
    Returns the active MongoDB database instance.
    Connects to MongoDB Atlas / server if reachable, or uses embedded mongomock in development/test.
    """
    global _client, _db
    if _db is not None:
        return _db

    try:
        # Attempt connection to MongoDB Atlas / server with short timeout
        test_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        test_client.admin.command('ping')
        _client = test_client
        _db = _client[DB_NAME]
        logger.info(f"Connected to MongoDB Atlas at {MONGO_URI} [DB: {DB_NAME}]")
    except Exception as e:
        logger.warning(f"MongoDB Atlas not reachable ({e}). Initializing embedded MongoDB engine.")
        _client = mongomock.MongoClient()
        _db = _client[DB_NAME]

    # Create helpful indexes
    try:
        _db.movies.create_index("id", unique=True)
        _db.movies.create_index("title")
        _db.users.create_index("id", unique=True)
        _db.users.create_index("email", unique=True)
        _db.user_preferences.create_index("user_id", unique=True)
        _db.ratings.create_index([("user_id", 1), ("movie_id", 1)], unique=True)
        _db.user_interactions.create_index("user_id")
        _db.user_searches.create_index([("user_id", 1), ("timestamp", -1)])
        _db.watchlists.create_index([("user_id", 1), ("movie_id", 1)], unique=True)
    except Exception:
        pass

    return _db

def get_db():
    db = get_database()
    yield db

db = get_database()
