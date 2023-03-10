import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ManufacturersModule,
  ],
})
export class AppModule {}
