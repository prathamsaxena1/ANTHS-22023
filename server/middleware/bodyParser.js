// middleware/bodyParser.js
const express = require('express');
const config = require('../config/config');

// Configure body parsers
const jsonParser = express.json({
  limit: config.maxFileSize // Use configured size limit
});

const urlencodedParser = express.urlencoded({
  extended: true,
  limit: config.maxFileSize
});

// Export configured parsers
module.exports = {
  jsonParser,
  urlencodedParser
};