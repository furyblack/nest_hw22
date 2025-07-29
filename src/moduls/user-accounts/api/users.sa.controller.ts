import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { CreateUserDto } from '../dto/create-input-dto';
import { GetUsersQueryDto } from '../dto/getUserQueryDto';

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class UsersSaController {
  constructor(private usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: CreateUserDto) {
    return this.usersService.createUserAndReturnDto(body);
  }

  @Get()
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getAllUsersWithPagination(query);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserByIdOutput(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('id') id: string) {
    await this.usersService.deleteById(id);
  }
}
