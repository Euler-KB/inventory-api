import { Module } from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';
import { ManufacturersController } from './manufacturers.controller';
import { CommonModule } from '../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manufacturer } from '../database/entities/manufacturer.entity';
import { Product } from '../database/entities/product.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Manufacturer, Product])],
  providers: [ManufacturersService],
  controllers: [ManufacturersController],
  exports: [ManufacturersService],
})
export class ManufacturersModule {}
