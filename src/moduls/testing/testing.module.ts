import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { TestingController } from './testing.controller';
import { BloggersPlatformModule } from '../blog-platform/bloggers-platform.module';

@Module({
  imports: [UserAccountsModule, BloggersPlatformModule],
  controllers: [TestingController],
  providers: [],
  exports: [],
})
export class TestingModule {}
