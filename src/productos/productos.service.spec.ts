import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductosService } from './productos.service';

describe('ProductosService', () => {
  let service: ProductosService;
  const prisma = {
    producto: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a product', async () => {
    const dto = {
      nombre: 'Teclado',
      precio: 30,
      descripcion: 'Teclado mecánico',
    };
    const producto = { id: 1, ...dto, stock: 0, categoria: null };
    prisma.producto.create.mockResolvedValue(producto);

    await expect(service.create(dto)).resolves.toEqual(producto);
    expect(prisma.producto.create).toHaveBeenCalledWith({
      data: { ...dto, stock: 0, categoria: null },
    });
  });

  it('lists products', async () => {
    const products = [
      {
        id: 1,
        nombre: 'Teclado',
        precio: 30,
        descripcion: 'Teclado mecánico',
        stock: 0,
        categoria: null,
      },
    ];
    prisma.producto.findMany.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual(products);
  });

  it('finds a product by id', async () => {
    const producto = {
      id: 1,
      nombre: 'Monitor',
      precio: 200,
      descripcion: 'Monitor 27 pulgadas',
      stock: 0,
      categoria: null,
    };
    prisma.producto.findUnique.mockResolvedValue(producto);

    await expect(service.findOne(producto.id)).resolves.toEqual(producto);
    expect(prisma.producto.findUnique).toHaveBeenCalledWith({
      where: { id: producto.id },
    });
  });

  it('updates only the provided product fields', async () => {
    const producto = {
      id: 1,
      nombre: 'Monitor',
      precio: 180,
      descripcion: 'Monitor 27 pulgadas',
      stock: 0,
      categoria: null,
    };
    prisma.producto.update.mockResolvedValue(producto);

    await expect(service.update(producto.id, { precio: 180 })).resolves.toEqual(
      producto,
    );
    expect(prisma.producto.update).toHaveBeenCalledWith({
      where: { id: producto.id },
      data: { precio: 180 },
    });
  });

  it('removes a product', async () => {
    const producto = {
      id: 1,
      nombre: 'Monitor',
      precio: 200,
      descripcion: 'Monitor 27 pulgadas',
      stock: 0,
      categoria: null,
    };
    prisma.producto.delete.mockResolvedValue(producto);

    await expect(service.remove(producto.id)).resolves.toEqual(producto);
    expect(prisma.producto.delete).toHaveBeenCalledWith({
      where: { id: producto.id },
    });
  });

  it('throws when a product does not exist', async () => {
    const notFound = () =>
      Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
    prisma.producto.findUnique.mockResolvedValue(null);
    prisma.producto.update.mockRejectedValue(notFound());
    prisma.producto.delete.mockRejectedValue(notFound());

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    await expect(service.update(999, { precio: 1 })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });

  it('rejects invalid stock and unexpected fields', async () => {
    await expect(
      service.create({
        nombre: 'Teclado',
        precio: 30,
        descripcion: 'Mecánico',
        stock: -1,
      }),
    ).rejects.toThrow(UnprocessableEntityException);
    await expect(service.update(1, { stock: -3 })).rejects.toThrow(
      UnprocessableEntityException,
    );
    await expect(service.update(1, { id: 2 } as never)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(prisma.producto.create).not.toHaveBeenCalled();
  });

  it('reports referenced products as conflict on delete', async () => {
    prisma.producto.delete.mockRejectedValue(
      Object.assign(new Error('FK'), { code: 'P2003' }),
    );
    await expect(service.remove(1)).rejects.toThrow(ConflictException);
  });
});
