import mongoose from "mongoose";
export const connectDB = async () => {
	try {
		const mongoUri = process.env.MONGODB_URI;
		if (!mongoUri) {
			throw new Error("MongoDB URI is not defined in environment variables");
		}
		await mongoose.connect(mongoUri);
		console.log("DB Connected");
	} catch (error) {
		console.log("Mongodb connection error", error);
		process.exit(1); // exit with failure
		// status code 1 means failure
		// status code 0 means success
	}
};
