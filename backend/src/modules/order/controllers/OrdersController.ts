import { Request, Response } from 'express';
import ListOrdersService from '@modules/order/services/ListOrdersService';
import CreateOrderService from '@modules/order/services/CreateOrderService';
import ShowSettingService from '@modules/settings/services/ShowSettingService';
import { decrypt } from '@shared/utils/crypto';
import Exchange from '@shared/utils/Exchange';
import UpdateOrderService from '@modules/order/services/UpdateOrderService';
import Order from '@modules/order/typeorm/entities/Order';

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
    const userId = request.user.id;
    const showSetting = new ShowSettingService();
    const setting = await showSetting.execute({ userId });

    if (!setting) {
      return response.sendStatus(400);
    }

    setting.secretKey = decrypt(setting?.secretKey);
    const exchange = new Exchange(setting);

    const { side, symbol, quantity, price, type, options, automationId } =
      request.body;

    let result;
    try {
      if (side === 'BUY')
        result = await exchange.buy(symbol, quantity, price, options);
      else result = await exchange.sell(symbol, quantity, price, options);
    } catch (err) {
      return response.status(400).json((err as any).body);
    }

    const createOrder = new CreateOrderService();

    const order = await createOrder.execute({
      automationId,
      symbol,
      quantity,
      type,
      side,
      price,
      options,
      orderId: result.orderId,
      clientOrderId: result.clientOrderId,
      transactTime: result.transactTime,
      status: result.status,
    });

    return response.status(201).json(order);
  }

  public async cancelOrder(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const userId = request.user.id;
    const updateOrder = new UpdateOrderService();
    const showSetting = new ShowSettingService();
    const setting = await showSetting.execute({ userId });

    if (!setting) {
      return response.sendStatus(400);
    }
    setting.secretKey = decrypt(setting?.secretKey);
    const exchange = new Exchange(setting);

    const { symbol, orderId } = request.params;

    let result;
    try {
      result = await exchange.cancel(symbol, orderId);
    } catch (err) {
      return response.status(400).json((err as any).body);
    }

    const newOrder = new Order();
    newOrder.status = result.status;
    const order = await updateOrder.updateByOrderId({
      orderId: result.orderId,
      clientOrderId: result.origClientOrderId,
      newOrder,
    });

    return response.json(order);
  }
}
