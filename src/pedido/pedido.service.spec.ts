import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidoService', () => {
  let service: PedidoService;
  const prisma = {
    $transaction: jest.fn(),
    producto: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    pedido: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
    },
    pedidoProducto: { deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
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
    const dto = { idcliente: 1, idproducto: 1, cantidad: 2 };
    const pedido = { id: 1, ...dto };
    prisma.producto.findUnique.mockResolvedValue({ id: 1, stock: 5 });
    prisma.pedido.findFirst.mockResolvedValue(null);
    prisma.producto.updateMany.mockResolvedValue({ count: 1 });
    prisma.pedido.create.mockResolvedValue(pedido);
    prisma.pedido.findMany.mockResolvedValue([pedido]);

    await expect(service.create(dto)).resolves.toEqual(pedido);
    await expect(service.findAll()).resolves.toEqual([pedido]);
    expect(prisma.pedido.create).toHaveBeenCalledWith({
      data: {
        idcliente: 1,
        cantidad: 2,
        estado: 'Pendiente',
        pedidoProductos: { create: { idproducto: 1 } },
      },
      include: { pedidoProductos: { include: { producto: true } } },
    });
  });

  it('finds an order and reports missing records', async () => {
    const pedido = { id: 1, estado: 'pendiente', cantidad: 2 };
    prisma.pedido.findUnique
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce(null);

    await expect(service.findOne(1)).resolves.toEqual(pedido);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('rejects missing product, insufficient stock and duplicate pending order', async () => {
    const dto = { idcliente: 1, idproducto: 2, cantidad: 3 };
    prisma.producto.findUnique.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toThrow(
      UnprocessableEntityException,
    );

    prisma.producto.findUnique.mockResolvedValue({ id: 2, stock: 2 });
    prisma.pedido.findFirst.mockResolvedValue({ id: 10 });
    await expect(service.create(dto)).rejects.toThrow(ConflictException);

    prisma.pedido.findFirst.mockResolvedValue(null);
    prisma.producto.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.create(dto)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(prisma.pedido.create).not.toHaveBeenCalled();
  });

  it('rejects malformed order data before writing', async () => {
    await expect(
      service.create({ idcliente: 1, idproducto: 2, cantidad: 0 }),
    ).rejects.toThrow(UnprocessableEntityException);
    await expect(
      service.create({
        idcliente: 1,
        idproducto: 2,
        cantidad: 1,
        estado: 'entregado',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
    await expect(service.update(1, { estado: 1 } as never)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('restores inventory when a pending order is denied', async () => {
    const pedido = {
      id: 1,
      estado: 'Pendiente',
      cantidad: 2,
      pedidoProductos: [{ idproducto: 3 }],
    };
    prisma.pedido.findUnique.mockResolvedValue(pedido);
    prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
    prisma.pedido.findUniqueOrThrow.mockResolvedValue({
      ...pedido,
      estado: 'negado',
    });

    await expect(
      service.update(1, { estado: 'negado' }),
    ).resolves.toMatchObject({ estado: 'negado' });
    expect(prisma.producto.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { stock: { increment: 2 } },
    });
  });

  it('blocks deletion of pending orders and removes relations for finished orders', async () => {
    prisma.pedido.findUnique
      .mockResolvedValueOnce({ id: 1, estado: 'Pendiente' })
      .mockResolvedValueOnce({ id: 2, estado: 'entregado' });
    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    prisma.pedido.delete.mockResolvedValue({ id: 2, estado: 'entregado' });
    await expect(service.remove(2)).resolves.toMatchObject({ id: 2 });
    expect(prisma.pedidoProducto.deleteMany).toHaveBeenCalledWith({
      where: { idpedido: 2 },
    });
  });

  it('translates the database uniqueness constraint to HTTP conflict', async () => {
    const dto = { idcliente: 1, idproducto: 1, cantidad: 1 };
    prisma.producto.findUnique.mockResolvedValue({ id: 1, stock: 2 });
    prisma.pedido.findFirst.mockResolvedValue(null);
    prisma.producto.updateMany.mockResolvedValue({ count: 1 });
    prisma.pedido.create.mockRejectedValue(
      Object.assign(new Error('Unique'), { code: 'P2002' }),
    );
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
});
