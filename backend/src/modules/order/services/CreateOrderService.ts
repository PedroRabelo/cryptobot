import { getCustomRepository } from 'typeorm';
import Order from '@modules/order/typeorm/entities/Order';
import OrdersRepository from '@modules/order/typeorm/repositories/OrdersRepository';

interface IRequest {
  side: string;
  symbol: string;
  quantity: string;
  price: string;
  type: string;
  automationId: number;
  options: {
    stopPrice: string;
  };
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  status: string;
}

class CreateOrderService {
  public async execute({
    symbol,
    quantity,
    price,
    automationId,
    type,
    side,
    options,
    orderId,
    clientOrderId,
    transactTime,
    status,
  }: IRequest): Promise<Order> {
    const ordersRepository = getCustomRepository(OrdersRepository);

    const newOrder = ordersRepository.create({
      symbol,
      quantity,
      limitPrice: price,
      automationId,
      type,
      side,
      stopPrice: options ? options.stopPrice : undefined,
      orderId,
      clientOrderId,
      transactTime,
      status,
    });

    await ordersRepository.save(newOrder);

    return newOrder;
  }
}

export default CreateOrderService;
