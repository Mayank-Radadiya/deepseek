// mongoose is a tool that helps us connect to and work with MongoDB databases
import mongoose, { Connection } from "mongoose";

// Adding a custom type definition to the global NodeJS object
declare global {
  namespace NodeJS {
    interface Global {
      // We're creating a cache (storage) for our database connection
      mongooseCache?: {
        connection: Connection | null; // The actual database connection (or null if not connected)
        promise: Promise<Connection> | null; // A promise that will give us the connection (or null)
      };
    }
  }
}

// Creating a typed version of the global object
// This helps TypeScript understand our custom mongooseCache property
const globalWithCache = global as typeof global & {
  mongooseCache?: {
    connection: Connection | null;
    promise: Promise<Connection> | null;
  };
};

// Setting up our cache if it doesn't exist
// Think of this as creating a storage box if we don't already have one
globalWithCache.mongooseCache = globalWithCache.mongooseCache || {
  connection: null, // No connection yet
  promise: null, // No connection promise yet
};

// Making a shorter name for our cache storage
const cached = globalWithCache.mongooseCache;

export default async function dbConnect() {
  // First check: Do we already have a connection?
  if (cached.connection) {
    return cached.connection;
  }

  // Second check: Do we have a connection in progress?
  if (!cached.promise) {
    // If not, let's create a new connection promise
    // A promise is like a ticket that says "I'll give you the connection when it's ready"
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI!) // Connect to MongoDB using a special address from our settings
      .then((mongooseInstance) => {
        // When connection succeeds...
        return mongooseInstance.connection; // Get the actual connection object
      });
  }

  // Now we try to get or wait for the connection
  try {
    // Wait for the connection promise to finish
    cached.connection = await cached.promise;
    // Tell ourselves we succeeded
    console.log("MongoDB connected successfully");
    // Return the connection for others to use
    return cached.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}
