import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Users from './users.entity';
import CreateUserDto from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async createUserIfNotExists(userData: CreateUserDto) {
    let user = await this.getUserByTelegramId(userData.telegramId);

    if (!user) {
      user = this.usersRepository.create(userData);
      await this.usersRepository.save(user);
    }

    return user;
  }

  async getUserByTelegramId(telegramId: string) {
    const user = await this.usersRepository.findOne({
      where: { telegramId },
    });

    return user;
  }

  async getAllTelegramIds() {
    const users = await this.usersRepository.find({
      select: ['telegramId'],
    });

    return users.map((user) => user.telegramId);
  }
}
