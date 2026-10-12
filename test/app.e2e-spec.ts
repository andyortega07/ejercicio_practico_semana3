import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/productos (POST) creates a product that can be retrieved by id', async () => {
    const response = await request(app.getHttpServer())
      .post('/productos')
      .send({
        nombre: 'Teclado',
        precio: 30,
        descripcion: 'Mecánico',
      })
      .expect(201);
    const productoCreado = JSON.parse(response.text) as {
      id: number;
      nombre: string;
      precio: number;
      descripcion: string;
    };

    return request(app.getHttpServer())
      .get(`/productos/${productoCreado.id}`)
      .expect(200)
      .expect(productoCreado);
  });

  afterEach(async () => {
    await app.close();
  });
});
