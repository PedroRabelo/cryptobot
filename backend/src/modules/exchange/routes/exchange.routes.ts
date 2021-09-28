import { Router } from 'express';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';
import ExchangeController from '@modules/exchange/controllers/ExchangeController';

const exchangeRouter = Router();
const exchangeController = new ExchangeController();

exchangeRouter.get('/balance', isAuthenticated, exchangeController.getBalance);

export default exchangeRouter;
