import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
import { ChefProjetService } from './services/chef-projet.service';
import { UsersController } from './controllers/users.controller';
import { ChefProjetController } from './controllers/chef-projet.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, ChefProjetController],
  providers: [UsersRepository, UsersService, ChefProjetService],
  exports: [UsersRepository, UsersService, ChefProjetService],
})
export class UsersModule {}
