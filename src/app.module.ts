import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsModule } from './moduls/user-accounts/user-accounts.module';
import { TestingController } from './moduls/testing/testing.controller';
import { TestingModule } from './moduls/testing/testing.module';
import { NotificationsModule } from './moduls/notifications/notifications.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { BloggersPlatformModule } from './moduls/blog-platform/bloggers-platform.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: '3991',
      database: 'blogger_platform',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),

    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    NotificationsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AppController, TestingController],
  providers: [AppService],
})
export class AppModule {}
