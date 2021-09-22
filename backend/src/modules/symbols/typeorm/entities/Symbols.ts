import { AbstractEntity } from '@shared/typeorm/entities/AbstractEntity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('symbols')
class Symbols extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column()
  base: string;

  @Column()
  quote: string;

  @Column({ name: 'base_precision' })
  basePrecision: number;

  @Column({ name: 'quote_precision' })
  quotePrecision: number;

  @Column({ name: 'min_notional' })
  minNotional: number;

  @Column({ name: 'min_lot_size' })
  minLotSize: number;

  @Column({ name: 'is_favorite' })
  isFavorite: boolean;
}

export default Symbols;
