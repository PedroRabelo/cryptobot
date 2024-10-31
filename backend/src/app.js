const express = require('express');
require('express-async-errors');

const cors = require('cors');
const helmet = require('helmet');

const authMiddleware = require('./middlewares/authMiddleware');
const authController = require('./controllers/authController');

const app = express();

const whitelist = (process.env.CORS_ORIGIN || '*').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (whitelist[0] === '*' || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS.`));
    }
  }
}));

app.use(helmet());

app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}


app.post('/login', authController.doLogin);
app.post('/logout', authController.doLogout);

const settingsRouter = require('./routers/settingsRouter');
app.use('/settings', authMiddleware, settingsRouter);

const symbolsRouter = require('./routers/symbolsRouter');
app.use('/symbols', authMiddleware, symbolsRouter);

const exchangeRouter = require('./routers/exchangeRouter');
app.use('/exchange', authMiddleware, exchangeRouter);

const ordersRouter = require('./routers/ordersRouter');
app.use('/orders', authMiddleware, ordersRouter);

const monitorsRouter = require('./routers/monitorsRouter');
app.use('/monitors', authMiddleware, monitorsRouter);

const automationsRouter = require('./routers/automationsRouter');
app.use('/automations', authMiddleware, automationsRouter);

const orderTemplatesRouter = require('./routers/orderTemplatesRouter');
app.use('/ordertemplates', authMiddleware, orderTemplatesRouter);

const withdrawTemplatesRouter = require('./routers/withdrawTemplatesRouter');
app.use('/withdrawtemplates', authMiddleware, withdrawTemplatesRouter);

const beholderRouter = require('./routers/beholderRouter');
app.use('/beholder', authMiddleware, beholderRouter);

const logsRouter = require('./routers/logsRouter');
app.use('/logs', authMiddleware, logsRouter);

const usersRouter = require('./routers/usersRouter');
app.use('/users', authMiddleware, usersRouter);

app.use(require('./middlewares/errorMIddleware'));

module.exports = app;