import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI_STRING;
if (!uri) {
  throw new Error('MONGO_URI_STRING is not defined in your .env file.');
}

const options = {
  maxPoolSize: 5, // Reduced pool size to avoid overwhelming the server
  serverSelectionTimeoutMS: 8000, // Increased timeout for server selection
  socketTimeoutMS: 30000, // Reduced socket timeout
  maxIdleTimeMS: 60000, // Increased idle time to reduce reconnections
  connectTimeoutMS: 15000, // Increased initial connection timeout
  retryWrites: true, // Enable retry for write operations
  retryReads: true, // Enable retry for read operations
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 