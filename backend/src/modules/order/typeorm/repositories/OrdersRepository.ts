import { EntityRepository, Repository } from 'typeorm';
import Order from '@modules/order/typeorm/entities/Order';

@EntityRepository(Order)
class OrdersRepository extends Repository<Order> {}

export default OrdersRepository;
