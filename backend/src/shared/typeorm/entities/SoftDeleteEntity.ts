import { Column, DeleteDateColumn } from 'typeorm';
import { AbstractEntity } from '../entities/AbstractEntity';
import { Exclude } from 'class-transformer';

export abstract class SoftDeleteEntity extends AbstractEntity {
  @DeleteDateColumn()
  @Exclude()
  deleted_at: Date;

  @Column()
  @Exclude()
  deleted_by: string;
}
