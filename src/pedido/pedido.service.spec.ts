import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidoService', () => {
  let service: PedidoService;
  const prisma = {
    pedido: {
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
        PedidoService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PedidoService>(PedidoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and lists orders through Prisma', async () => {
    const dto = { estado: 'pendiente', cantidad: 2 };
    const pedido = { id: 1, ...dto };
    prisma.pedido.create.mockResolvedValue(pedido);
    prisma.pedido.findMany.mockResolvedValue([pedido]);

    await expect(service.create(dto)).resolves.toEqual(pedido);
    await expect(service.findAll()).resolves.toEqual([pedido]);
    expect(prisma.pedido.create).toHaveBeenCalledWith({ data: dto });
  });

  it('finds an order and reports missing records', async () => {
    const pedido = { id: 1, estado: 'pendiente', cantidad: 2 };
    prisma.pedido.findUnique
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce(null);

    await expect(service.findOne(1)).resolves.toEqual(pedido);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('updates and removes orders', async () => {
    const pedido = { id: 1, estado: 'enviado', cantidad: 2 };
    prisma.pedido.update.mockResolvedValue(pedido);
    prisma.pedido.delete.mockResolvedValue(pedido);

    await expect(service.update(1, { estado: 'enviado' })).resolves.toEqual(
      pedido,
    );
    await expect(service.remove(1)).resolves.toEqual(pedido);
    expect(prisma.pedido.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estado: 'enviado' },
    });
    expect(prisma.pedido.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('maps Prisma missing-record errors to not found', async () => {
    const notFound = Object.assign(new Error('Record not found'), {
      code: 'P2025',
    });
    prisma.pedido.update.mockRejectedValue(notFound);
    prisma.pedido.delete.mockRejectedValue(notFound);

    await expect(service.update(999, { cantidad: 1 })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
