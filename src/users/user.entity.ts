import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telegramId: number;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  username: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

export default User;