/**
 * Global Error Handling Middleware for Express.
 * Catches errors, formats them, and returns standard JSON responses.
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || "Internal Server Error";
  error.statusCode = err.statusCode || 500;

  // Log error stack trace in development
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  // Mongoose Bad ObjectId (Cast Error)
  if (err.name === "CastError") {
    error.message = `Resource not found with id of ${err.value}`;
    error.statusCode = 400;
  }

  // Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(", ");
    error.message = `Duplicate field value entered for: ${fields}. Please use another value.`;
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    error.message = Object.values(err.errors).map((val) => val.message).join(", ");
    error.statusCode = 400;
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
