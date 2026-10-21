import { Test, TestingModule } from '@nestjs/testing';
import { PedidoProductoController } from './pedido-producto.controller';
import { PedidoProductoService } from './pedido-producto.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidoProductoController', () => {
  let controller: PedidoProductoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidoProductoController],
      providers: [
        PedidoProductoService,
        {
          provide: PrismaService,
          useValue: {
            pedidoproducto: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<PedidoProductoController>(PedidoProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
