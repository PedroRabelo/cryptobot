const { isBlacklisted } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  if (!process.env.JWT_SECRET) return res.status(500).json('No JWT Secret.');

  const token = req.headers['authorization'];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        if (!isBlacklisted(token)) {
          res.locals.token = decoded;
          return next();
        }
      }
    } catch (error) {
      logger('system', err);
    }
  }

  res.status(401).json('Unauthorized');
}