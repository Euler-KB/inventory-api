import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Manufacturer } from '../database/entities/manufacturer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { BackgroundService } from '../common/providers/background.service';
import { Product } from '../database/entities/product.entity';
import { KeyValueList } from '../database/interfaces/key-value.list';

@Injectable()
export class ManufacturersService {
  constructor(
    @InjectRepository(Manufacturer)
    private manufacturerRepository: Repository<Manufacturer>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private backgroundService: BackgroundService,
  ) {
    backgroundService.handleEventCompleted(
      'products',
      async (manufacturerId, products) => {
        const manufacturer = new Manufacturer();
        manufacturer.id = manufacturerId;
        await productsRepository.save(
          products.map((prod) => ({
            ...prod,
            specifications: [],
            manufacturer,
          })),
        );
      },
    );

    backgroundService.handleEventCompleted(
      'spec',
      async (productId, specifications) => {
        await productsRepository.update(productId, { specifications });
      },
    );
  }

  async getAll(): Promise<Manufacturer[]> {
    return await this.manufacturerRepository.find();
  }

  async getManufacturer(id: string) {
    return await this.manufacturerRepository.findOne({ where: { id } });
  }

  async getProducts(
    manufacturerId: string,
  ): Promise<null | string | Product[]> {
    const manufacturer = await this.getManufacturer(manufacturerId);
    if (!manufacturer) return null;

    //  job hasn't started yet?? - begin now
    if (!manufacturer.workerJobId) {
      return await this.beginProductsCrawler(manufacturer);
    }

    const status = await this.backgroundService.getJobStatus(
      manufacturer.workerJobId,
    );
    if (status == 'running' || status == 'faulted')
      return manufacturer.workerJobId;

    return await this.productsRepository.find({
      where: { manufacturer: { id: manufacturerId } },
    });
  }

  async getProductSpecification(
    productId: string,
  ): Promise<null | string | KeyValueList<string[]>> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: {
        manufacturer: true,
      },
    });

    if (!product) return null;

    /// job hasn't started yet?? begin worker
    if (!product.workerJobId) {
      return await this.beginSpecificationCrawler(product);
    }

    const status = await this.backgroundService.getJobStatus(
      product.workerJobId,
    );
    if (status == 'running' || status == 'faulted') return product.workerJobId;

    return product.specifications || [];
  }

  private async beginSpecificationCrawler(product: Product): Promise<string> {
    const jobId = await this.backgroundService.addSpecificationJob({
      productId: product.id,
    });

    await this.productsRepository.update(product.id, {
      workerJobId: jobId,
    });

    return jobId;
  }

  async addManufacturer(model: CreateManufacturerDto) {
    const instance: Manufacturer = new Manufacturer();
    instance.name = model.name;
    instance.website = model.website;
    instance.crawlerSpec = model.crawlerSpec;

    //  create manufacturer
    await this.manufacturerRepository.save(instance);

    //  begin job
    instance.workerJobId = await this.beginProductsCrawler(instance);

    return instance;
  }

  private async beginProductsCrawler(
    manufacturer: Manufacturer,
  ): Promise<string> {
    const jobId = await this.backgroundService.addProductsJob({
      manufacturerId: manufacturer.id,
      website: manufacturer.website,
      query: manufacturer.crawlerSpec.product,
    });

    await this.manufacturerRepository.update(manufacturer.id, {
      workerJobId: jobId,
    });

    return jobId;
  }
}
