import { getCustomRepository } from 'typeorm';
import Order from '@modules/order/typeorm/entities/Order';
import OrdersRepository from '@modules/order/typeorm/repositories/OrdersRepository';

interface IRequest {
  orderId: number;
  clientOrderId: string;
}

class ShowExchangeOrderService {
  public async execute({
    orderId,
    clientOrderId,
  }: IRequest): Promise<Order | undefined> {
    const ordersRepository = getCustomRepository(OrdersRepository);

    const order = await ordersRepository.findOne({
      where: { orderId, clientOrderId },
    });

    return order;
  }
}

export default ShowExchangeOrderService;
