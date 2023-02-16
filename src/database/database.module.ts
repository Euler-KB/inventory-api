import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manufacturer } from './entities/manufacturer.entity';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'inventory_db.db3',
      entities: [Manufacturer, Product],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
