import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { ManufacturerDto } from './dto/manufacturer.dto';
import {
  ProductsResponse,
  SpecificationResponse,
} from './dto/queued-response.dto';
import { ProductDto } from './dto/product.dto';
import { Manufacturer } from '../database/entities/manufacturer.entity';
import { BackgroundService } from '../common/providers/background.service';
import { Product } from '../database/entities/product.entity';
import { ApiResponse } from '@nestjs/swagger';
import { JobStatusDto } from './dto/job-status.dto';

@Controller('manufacturers')
export class ManufacturersController {
  constructor(
    private readonly manufacturerService: ManufacturersService,
    private backgroundService: BackgroundService,
  ) {}

  private static mapManufacturerDto(model: Manufacturer): ManufacturerDto {
    return {
      id: model.id,
      name: model.name,
      website: model.website,
      dateCreated: model.dateCreated,
    };
  }

  private static mapProductDto(model: Product): ProductDto {
    return {
      id: model.id,
      properties: model.properties,
      dateCreated: model.dateCreated,
    };
  }

  @Get()
  @ApiResponse({ status: 200, type: [ManufacturerDto] })
  async getAll(): Promise<ManufacturerDto[]> {
    return (await this.manufacturerService.getAll()).map((model) =>
      ManufacturersController.mapManufacturerDto(model),
    );
  }

  @Get('/:id/products')
  @ApiResponse({ status: 200, type: ProductsResponse })
  @ApiResponse({ status: 400 })
  async getProducts(@Param('id') id: string): Promise<ProductsResponse> {
    const result = await this.manufacturerService.getProducts(id);
    if (result == null) throw new NotFoundException();

    const response = new ProductsResponse();
    if (Array.isArray(result)) {
      response.data = result.map((item) =>
        ManufacturersController.mapProductDto(item),
      );
    } else {
      response.jobId = result as string;
      response.data = null;
    }

    return response;
  }

  @Get('/specification/:productId/product')
  @ApiResponse({ status: 200, type: SpecificationResponse })
  async getSpecification(
    @Param('productId') productId: string,
  ): Promise<SpecificationResponse> {
    const result = await this.manufacturerService.getProductSpecification(
      productId,
    );
    if (result == null) throw new NotFoundException();

    const response = new SpecificationResponse();
    if (Array.isArray(result)) {
      response.data = result;
    } else {
      response.jobId = result as string;
      response.data = null;
    }

    return response;
  }

  @HttpCode(201)
  @Post('/create')
  @ApiResponse({ status: 201, type: ManufacturerDto })
  async addManufacturer(
    @Body() model: CreateManufacturerDto,
  ): Promise<ManufacturerDto> {
    const manufacturer = await this.manufacturerService.addManufacturer(model);
    return ManufacturersController.mapManufacturerDto(manufacturer);
  }

  @Get('/status/:jobId')
  @ApiResponse({ status: 200, type: JobStatusDto })
  async getJobStatus(@Param('jobId') jobId: string): Promise<JobStatusDto> {
    const status = await this.backgroundService.getJobStatus(jobId);
    if (status == null) throw new NotFoundException();
    return {
      status,
    };
  }
}
