// models/BlacklistedToken.js
const mongoose = require('mongoose');

const BlacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Automatically delete expired tokens
  }
});

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);

// In auth middleware
const BlacklistedToken = require('../models/BlacklistedToken');

// Additional check in protect middleware
const tokenBlacklisted = await BlacklistedToken.findOne({ token });
if (tokenBlacklisted) {
  return res.status(401).json({
    success: false,
    message: 'Token has been revoked'
  });
}

// Logout implementation
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    
    // Get token expiration from payload
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    // Add to blacklist
    await BlacklistedToken.create({
      token,
      expiresAt
    });
    
    // Clear cookie if using cookies
    res.clearCookie('token');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};