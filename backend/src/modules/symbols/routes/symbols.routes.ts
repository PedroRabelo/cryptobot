import { Router } from 'express';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';
import SymbolsController from '@modules/symbols/controllers/SymbolsController';

const symbolsRouter = Router();
const symbolsController = new SymbolsController();

symbolsRouter.get('/', isAuthenticated, symbolsController.index);
symbolsRouter.get('/:id', isAuthenticated, symbolsController.show);
symbolsRouter.patch('/:id', isAuthenticated, symbolsController.update);
symbolsRouter.post('/sync', isAuthenticated, symbolsController.syncSymbols);

export default symbolsRouter;
