from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv('MONGO_URI')
DATABASE_NAME = 'rtsp_livestream'

print("Testing MongoDB Atlas Connection...")
print(f"Database Name: {DATABASE_NAME}")
print(f"Connection URI: {MONGODB_URI[:30] if MONGODB_URI else 'NOT SET'}...")

try:
    # Create client
    client = MongoClient(MONGODB_URI)
    
    # Test connection
    client.admin.command('ping')
    print("✓ Successfully connected to MongoDB Atlas!")
    
    # Get database
    db = client[DATABASE_NAME]
    
    # List collections
    collections = db.list_collection_names()
    print(f"✓ Database '{DATABASE_NAME}' is accessible")
    print(f"Collections: {collections if collections else 'No collections yet'}")
    
    # Test write operation
    test_collection = db['connection_test']
    result = test_collection.insert_one({"test": "connection successful"})
    print(f"✓ Write test successful - Document ID: {result.inserted_id}")
    
    # Test read operation
    doc = test_collection.find_one({"test": "connection successful"})
    print(f"✓ Read test successful - Found document: {doc}")
    
    # Clean up test document
    test_collection.delete_one({"_id": result.inserted_id})
    print("✓ Cleanup successful")
    
    print("\n🎉 All tests passed! Your MongoDB Atlas connection is working perfectly!")
    
except Exception as e:
    print(f"\n❌ Connection failed: {str(e)}")
    print("\nTroubleshooting steps:")
    print("1. Check your .env file has the correct MONGO_URI")
    print("2. Verify your MongoDB Atlas password in the connection string")
    print("3. Ensure your IP is whitelisted in MongoDB Atlas Network Access")
    print("4. Check if dnspython is installed: pip install dnspython")