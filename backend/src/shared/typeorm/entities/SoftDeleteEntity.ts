import { Column, DeleteDateColumn } from 'typeorm';
import { AbstractEntity } from '../entities/AbstractEntity';

export abstract class SoftDeleteEntity extends AbstractEntity {
  @DeleteDateColumn()
  deleted_at: Date;

  @Column()
  deleted_by: string;
}
