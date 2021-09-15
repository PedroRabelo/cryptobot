import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from '@shared/typeorm/entities/SoftDeleteEntity';

@Entity('users')
class User extends SoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  avatar: string;
}

export default User;
