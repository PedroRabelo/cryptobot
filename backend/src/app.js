const express = require('express');
require('express-async-errors');

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authMiddleware = require('./middlewares/authMiddleware');
const authController = require('./controllers/authController');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));

app.use(helmet());

app.use(express.json());

app.use(morgan('dev'));

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

app.use(require('./middlewares/errorMIddleware'));

module.exports = app;