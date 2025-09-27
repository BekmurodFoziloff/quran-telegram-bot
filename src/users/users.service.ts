import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Users from './entities/users.entity';
import CreateUserDto from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async createUser(userData: CreateUserDto) {
    let user = await this.getUserByTelegramId(userData.telegramId);

    if (!user) {
      user = this.usersRepository.create(userData);
      await this.usersRepository.save(user);
    }

    return user;
  }

  async getUserByTelegramId(telegramId: string) {
    return this.usersRepository.findOne({
      where: { telegramId },
    });
  }

  async getAllTelegramIds() {
    const users = await this.usersRepository.find({
      select: ['telegramId'],
    });

    return users.map((user) => user.telegramId);
  }
}
