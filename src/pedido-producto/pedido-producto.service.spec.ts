import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PedidoProductoService } from './pedido-producto.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidoProductoService', () => {
  let service: PedidoProductoService;
  const prisma = {
    pedidoproducto: {
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
        PedidoProductoService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PedidoProductoService>(PedidoProductoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and lists order products through Prisma', async () => {
    const dto = { idpedido: 1, idproducto: 2 };
    const pedidoProducto = { id: 1, ...dto };
    prisma.pedidoproducto.create.mockResolvedValue(pedidoProducto);
    prisma.pedidoproducto.findMany.mockResolvedValue([pedidoProducto]);

    await expect(service.create(dto)).resolves.toEqual(pedidoProducto);
    await expect(service.findAll()).resolves.toEqual([pedidoProducto]);
    expect(prisma.pedidoproducto.create).toHaveBeenCalledWith({ data: dto });
  });

  it('finds an order product and reports missing records', async () => {
    const pedidoProducto = { id: 1, idpedido: 1, idproducto: 2 };
    prisma.pedidoproducto.findUnique
      .mockResolvedValueOnce(pedidoProducto)
      .mockResolvedValueOnce(null);

    await expect(service.findOne(1)).resolves.toEqual(pedidoProducto);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('updates and removes order products', async () => {
    const pedidoProducto = { id: 1, idpedido: 1, idproducto: 3 };
    prisma.pedidoproducto.update.mockResolvedValue(pedidoProducto);
    prisma.pedidoproducto.delete.mockResolvedValue(pedidoProducto);

    await expect(service.update(1, { idproducto: 3 })).resolves.toEqual(
      pedidoProducto,
    );
    await expect(service.remove(1)).resolves.toEqual(pedidoProducto);
    expect(prisma.pedidoproducto.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { idproducto: 3 },
    });
    expect(prisma.pedidoproducto.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('maps Prisma missing-record errors to not found', async () => {
    const notFound = Object.assign(new Error('Record not found'), {
      code: 'P2025',
    });
    prisma.pedidoproducto.update.mockRejectedValue(notFound);
    prisma.pedidoproducto.delete.mockRejectedValue(notFound);

    await expect(service.update(999, { idproducto: 1 })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
