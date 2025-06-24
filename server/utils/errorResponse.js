// utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates if this is an operational error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;