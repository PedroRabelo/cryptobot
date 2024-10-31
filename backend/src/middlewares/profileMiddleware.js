const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  try {
    if (req.headers.origin === process.env.HYDRA_URL
      && res.locals.token.profile === 'ADMIN')
      return next();
  } catch (error) {
    logger('system', err);
  }

  res.sendStatus(403);
}