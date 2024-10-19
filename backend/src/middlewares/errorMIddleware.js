const logger = require('../utils/logger');

module.exports = (error, req, res) => {
  logger('system', error);
  res.status(500).json(error.response ? error.response.data : error.message)
}