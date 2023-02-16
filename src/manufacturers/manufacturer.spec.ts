import { Test, TestingModule } from '@nestjs/testing';
import { ManufacturersController } from './manufacturers.controller';
import { ManufacturersService } from './manufacturers.service';
import { BackgroundService } from '../common/providers/background.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';

describe('ManufacturerController', () => {
  let controller: ManufacturersController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ManufacturersController],
      providers: [ManufacturersService, BackgroundService],
    }).compile();
    controller = app.get<ManufacturersController>(ManufacturersController);
  });
});
