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
    let nextOrderId = 1;
    const pedidos: Array<{
      id: number;
      idcliente: number;
      estado: string;
      cantidad: number;
    }> = [];
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
        callback(prisma),
      ),
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
        updateMany: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: number; stock: { gte: number } };
            data: { stock: { decrement: number } };
          }) => {
            const producto = productos.get(where.id);
            if (!producto || producto.stock < where.stock.gte)
              return { count: 0 };
            producto.stock -= data.stock.decrement;
            return { count: 1 };
          },
        ),
      },
      pedido: {
        findFirst: jest.fn(
          ({ where }: { where: { idcliente: number; estado: string } }) =>
            pedidos.find(
              (pedido) =>
                pedido.idcliente === where.idcliente &&
                pedido.estado === where.estado,
            ) ?? null,
        ),
        create: jest.fn(
          ({
            data,
          }: {
            data: {
              idcliente: number;
              estado: string;
              cantidad: number;
              pedidoProductos: { create: { idproducto: number } };
            };
          }) => {
            const pedido = {
              id: nextOrderId++,
              idcliente: data.idcliente,
              estado: data.estado,
              cantidad: data.cantidad,
            };
            pedidos.push(pedido);
            return {
              ...pedido,
              pedidoProductos: [
                {
                  idproducto: data.pedidoProductos.create.idproducto,
                  producto: productos.get(
                    data.pedidoProductos.create.idproducto,
                  ),
                },
              ],
            };
          },
        ),
      },
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

  it('enforces product, inventory and pending-order rules over HTTP', async () => {
    const producto = await request(app.getHttpServer())
      .post('/productos')
      .send({
        nombre: 'Teclado',
        precio: 30,
        descripcion: 'Mecánico',
        stock: 3,
      })
      .expect(201);
    const idproducto = (producto.body as { id: number }).id;
    const pedido = await request(app.getHttpServer())
      .post('/pedido')
      .send({ idcliente: 1, idproducto, cantidad: 2 })
      .expect(201);
    expect(pedido.body).toMatchObject({ estado: 'Pendiente', cantidad: 2 });
    await request(app.getHttpServer())
      .post('/pedido')
      .send({ idcliente: 1, idproducto, cantidad: 1 })
      .expect(409);
    await request(app.getHttpServer())
      .post('/pedido')
      .send({ idcliente: 2, idproducto, cantidad: 2 })
      .expect(422);
    await request(app.getHttpServer())
      .post('/pedido')
      .send({ idcliente: 2, idproducto: 9999, cantidad: 1 })
      .expect(422);
    await request(app.getHttpServer())
      .post('/pedido-producto')
      .send({ idpedido: 1, idproducto })
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
