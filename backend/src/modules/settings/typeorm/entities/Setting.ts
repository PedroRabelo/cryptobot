import { AbstractEntity } from '@shared/typeorm/entities/AbstractEntity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from '@modules/users/typeorm/entities/User';

@Entity('settings')
class Setting extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'api_url' })
  apiUrl: string;

  @Column({ name: 'access_key' })
  accessKey: string;

  @Column({ name: 'secret_key' })
  secretKey: string;

  @Column({ name: 'stream_url' })
  streamUrl: string;
}

export default Setting;
