const getErrorStatusCode = (error) => {
  if (
    Number.isInteger(error?.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode < 600
  ) {
    return error.statusCode;
  }

  return 500;
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404,
    },
  });
};

export const globalErrorHandler = (error, req, res, next) => {
  const statusCode = getErrorStatusCode(error);

  if (statusCode >= 500) {
    console.error(error);
  }

  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      message:
        statusCode === 500
          ? "Internal server error"
          : error.message,
      statusCode,
    },
  });
};