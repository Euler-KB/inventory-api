import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductCrawlerRecord } from '../../common/interfaces/product.crawler.record';

@Entity({ name: 'Manufacturer' })
export class Manufacturer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  website: string;

  @Column('simple-json', { nullable: true })
  crawlerSpec: {
    product: ProductCrawlerRecord;
  };

  @Column({ nullable: true })
  workerJobId: string;

  @OneToMany(() => Product, (product) => product.manufacturer)
  products: Product[];

  @CreateDateColumn()
  dateCreated: Date;
}
