import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestingController {
  constructor(
    private dataSource: DataSource, // подключаем DataSource
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    await this.dataSource.transaction(async (manager) => {
      // Очищаем таблицы (порядок важен из-за связей FK)
      await manager.query(`DELETE FROM sessions`);
      await manager.query(`DELETE FROM posts`);
      await manager.query(`DELETE FROM blogs`);
      await manager.query(`DELETE FROM users`);
    });
  }
}
