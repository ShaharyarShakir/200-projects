import "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { testS3Connection } from "./services/storage.service.js";

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Test S3 Connection
  await testS3Connection();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  });
};

startServer();