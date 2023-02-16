import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateManufacturerDto } from '../src/manufacturers/dto/create-manufacturer.dto';
import * as MOCK_PROVIDER from './mock-data/lenovo.mock.json';

describe('Lenovo (E2E)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create provider successfully', () => {
    const createDto = MOCK_PROVIDER as CreateManufacturerDto;

    return request(app.getHttpServer())
      .post('/manufacturers/create')
      .send(createDto)
      .expect(201)
      .then((res) => {
        expect(res.body).toMatchObject({
          id: expect.any(String),
          name: 'Lenovo',
          website: 'https://www.lenovo.com/',
          dateCreated: expect.any(String),
        });

        return request(app.getHttpServer())
          .get(`/manufacturers/${res.body.id}/products`)
          .expect(200)
          .then((res) => {
            expect(res.body).toHaveProperty('jobId');
            expect(res.body.data).toBeNull();
          });
      });
  });

  it('should get manufacturer successfully', () => {
    return request(app.getHttpServer())
      .get('/manufacturers')
      .expect(200)
      .then((res) => {
        expect(res.body).toContainEqual(
          expect.objectContaining(<any>{
            name: 'Lenovo',
            website: 'https://www.lenovo.com/',
          }),
        );
      });
  });
});
