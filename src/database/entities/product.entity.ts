import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Manufacturer } from './manufacturer.entity';
import { KeyValueList } from '../interfaces/key-value.list';
import { SpecificationMetadata } from '../interfaces/specification.meta';

@Entity({ name: 'Product' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-json')
  properties: KeyValueList<string>;

  @Column('simple-json')
  meta: SpecificationMetadata;

  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.products)
  manufacturer: Manufacturer;

  @Column({ nullable: true })
  workerJobId: string;

  @Column('simple-json', { nullable: true })
  specifications: KeyValueList<string[]>;

  @CreateDateColumn()
  dateCreated: Date;
}
