import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';
import Order from '@modules/order/typeorm/entities/Order';
import OrdersRepository from '../typeorm/repositories/OrdersRepository';

interface IRequest {
  orderId: number;
  clientOrderId: string;
  newOrder: Order;
}

class UpdateOrderService {
  public async updateById({ orderId, newOrder }: IRequest): Promise<Order> {
    const orderRepository = getCustomRepository(OrdersRepository);

    const currentOrder = await orderRepository.findOne(orderId);

    if (!currentOrder) {
      throw new AppError('Ordem não encontrada.');
    }

    return this.updateOrder(currentOrder, newOrder);
  }

  public async updateByOrderId({
    orderId,
    clientOrderId,
    newOrder,
  }: IRequest): Promise<Order> {
    const orderRepository = getCustomRepository(OrdersRepository);

    const currentOrder = await orderRepository.findOne({
      where: {
        orderId,
        clientOrderId,
      },
    });

    if (!currentOrder) {
      throw new AppError('Ordem não encontrada.');
    }

    return this.updateOrder(currentOrder, newOrder);
  }

  public async updateOrder(
    currentOrder: Order,
    newOrder: Order,
  ): Promise<Order> {
    const orderRepository = getCustomRepository(OrdersRepository);

    if (newOrder.status && newOrder.status !== currentOrder.status)
      currentOrder.status = newOrder.status;

    if (newOrder.avgPrice && newOrder.avgPrice !== currentOrder.avgPrice)
      currentOrder.avgPrice = newOrder.avgPrice;

    if (newOrder.obs && newOrder.obs !== currentOrder.obs)
      currentOrder.obs = newOrder.obs;

    if (
      newOrder.transactTime &&
      newOrder.transactTime !== currentOrder.transactTime
    )
      currentOrder.transactTime = newOrder.transactTime;

    if (newOrder.commission && newOrder.commission !== currentOrder.commission)
      currentOrder.commission = newOrder.commission;

    if (newOrder.net && newOrder.net !== currentOrder.net)
      currentOrder.net = newOrder.net;

    if (
      newOrder.isMaker !== null &&
      newOrder.isMaker !== undefined &&
      newOrder.isMaker !== currentOrder.isMaker
    )
      currentOrder.isMaker = newOrder.isMaker;

    await orderRepository.save(currentOrder);
    return currentOrder;
  }
}

export default UpdateOrderService;
