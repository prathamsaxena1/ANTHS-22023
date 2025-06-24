// middleware/requestId.js
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to assign a unique ID to each request
 * Useful for tracking requests across logs
 */
const requestId = (req, res, next) => {
  // Use existing request ID if provided (e.g., from load balancer)
  const existingRequestId = req.headers['x-request-id'];
  
  // If there's no existing request ID, generate a new one
  req.id = existingRequestId || uuidv4();
  
  // Add the request ID to response headers
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

module.exports = requestId;