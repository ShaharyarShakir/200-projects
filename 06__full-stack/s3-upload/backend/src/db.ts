import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to db", error);
  }
};
