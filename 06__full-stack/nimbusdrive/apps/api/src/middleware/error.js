export const errorHandler = (err, req, res, next) => {
  console.error("API Error:", err);
  
  let statusCode = err.statusCode || 500;
  let message = statusCode === 500 ? "Internal Server Error" : err.message;
  let errors = [];

  // Format Zod validation errors
  if (err.name === "ZodError" || (err.issues && Array.isArray(err.issues))) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
