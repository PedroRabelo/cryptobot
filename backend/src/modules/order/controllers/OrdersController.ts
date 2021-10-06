import { Request, Response } from 'express';
import ListOrdersService from '@modules/order/services/ListOrdersService';
import CreateOrderService from '@modules/order/services/CreateOrderService';

export default class OrdersController {
  public async getOrders(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const listOrders = new ListOrdersService();
    const symbol = request.params.symbol && request.params.symbol.toUpperCase();
    //const page = parseInt(request.query.page);

    const orders = await listOrders.execute({ symbol, page: 1 });

    return response.json(orders);
  }

  public async placeOrder(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const { side, symbol, quantity, price, type, options, automationId } =
      request.body;

    const createOrder = new CreateOrderService();

    const order = await createOrder.execute({
      automationId,
      symbol,
      quantity,
      type,
      side,
      price,
      options,
    });

    return response.status(201).json(order);
  }
}
