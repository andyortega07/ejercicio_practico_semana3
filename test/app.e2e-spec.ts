import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    type ProductoTest = {
      id: number;
      nombre: string;
      precio: number;
      descripcion: string;
      stock: number;
      categoria: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    const productos = new Map<number, ProductoTest>();
    let nextProductId = 1;
    const prisma = {
      producto: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Pick<ProductoTest, 'nombre' | 'precio' | 'descripcion'> &
              Partial<Pick<ProductoTest, 'stock' | 'categoria'>>;
          }) => {
            const now = new Date();
            const producto: ProductoTest = {
              id: nextProductId++,
              nombre: data.nombre,
              precio: data.precio,
              descripcion: data.descripcion,
              stock: data.stock ?? 0,
              categoria: data.categoria ?? null,
              createdAt: now,
              updatedAt: now,
            };
            productos.set(producto.id, producto);
            return producto;
          },
        ),
        findUnique: jest.fn(
          ({ where }: { where: { id: number } }) =>
            productos.get(where.id) ?? null,
        ),
      },
      pedido: {},
      pedidoproducto: {},
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

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
