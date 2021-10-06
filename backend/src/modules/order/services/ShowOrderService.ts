import { getCustomRepository } from 'typeorm';
import Order from '@modules/order/typeorm/entities/Order';
import OrdersRepository from '@modules/order/typeorm/repositories/OrdersRepository';

interface IRequest {
  orderId: number;
}

class ShowOrderService {
  public async execute({ orderId }: IRequest): Promise<Order | undefined> {
    const ordersRepository = getCustomRepository(OrdersRepository);

    const order = await ordersRepository.findOne(orderId);

    return order;
  }
}

export default ShowOrderService;
