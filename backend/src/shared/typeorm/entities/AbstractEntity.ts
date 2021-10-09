import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export abstract class AbstractEntity {
  @CreateDateColumn()
  @Exclude()
  created_at?: Date;

  @UpdateDateColumn()
  @Exclude()
  updated_at?: Date;
}
