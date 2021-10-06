import { AbstractEntity } from '@shared/typeorm/entities/AbstractEntity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orders')
class Order extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'automation_id' })
  automationId: number;

  @Column()
  symbol: string;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'client_order_id' })
  clientOrderId: string;

  @Column({ name: 'transact_time' })
  transactTime: number;

  @Column()
  type: string;

  @Column()
  side: string;

  @Column()
  status: string;

  @Column({ name: 'is_maker' })
  isMaker: boolean;

  @Column({ name: 'limit_price' })
  limitPrice: string;

  @Column({ name: 'stop_price' })
  stopPrice: string;

  @Column({ name: 'avg_price' })
  avgPrice: number;

  @Column()
  commission: string;

  @Column()
  net: number;

  @Column()
  quantity: string;

  @Column()
  obs: string;
}

export default Order;
