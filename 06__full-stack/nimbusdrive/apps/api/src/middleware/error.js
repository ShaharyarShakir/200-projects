export const errorHandler = (err, req, res, next) => {
  console.error("API Error:", err);
  
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;
  
  res.status(statusCode).json({
    success: false,
    message
  });
};
