import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB database.
 * If the connection fails, logs error and exits process with failure code.
 */
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/devboard";
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
