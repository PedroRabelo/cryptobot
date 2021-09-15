import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from '@shared/typeorm/entities/AbstractEntity';

@Entity('user_tokens')
class UserToken extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  token: string;

  @Column()
  user_id: number;
}

export default UserToken;
