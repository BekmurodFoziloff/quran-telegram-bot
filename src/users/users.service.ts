import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import User from './user.entity';
import CreateUserDto from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreate(userData: CreateUserDto) {
    let user = await this.userRepository.findOne({
      where: { telegramId: userData.telegramId },
    });

    if (!user) {
      user = this.userRepository.create(userData);
      await this.userRepository.save(user);
    }

    return user;
  }
}
