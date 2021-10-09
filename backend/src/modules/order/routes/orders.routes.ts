import { Router } from 'express';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';
import OrdersController from '@modules/order/controllers/OrdersController';

const ordersRouter = Router();
const ordersController = new OrdersController();

ordersRouter.get('/:symbol?', isAuthenticated, ordersController.getOrders);
ordersRouter.post('/', isAuthenticated, ordersController.placeOrder);
ordersRouter.delete(
  '/:symbol/:orderId',
  isAuthenticated,
  ordersController.cancelOrder,
);

export default ordersRouter;
