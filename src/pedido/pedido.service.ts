import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PrismaService } from '../prisma/prisma.service';
import { isMissingPrismaRecord } from '../prisma/prisma-errors';

@Injectable()
export class PedidoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPedidoDto: CreatePedidoDto) {
    return this.prisma.pedido.create({ data: createPedidoDto });
  }

  findAll() {
    return this.prisma.pedido.findMany();
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw this.pedidoNotFound(id);
    }

    return pedido;
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    return this.handleMissingPedido(id, () =>
      this.prisma.pedido.update({
        where: { id },
        data: updatePedidoDto,
      }),
    );
  }

  remove(id: number) {
    return this.handleMissingPedido(id, () =>
      this.prisma.pedido.delete({ where: { id } }),
    );
  }

  private pedidoNotFound(id: number): NotFoundException {
    return new NotFoundException(`No se encontró el pedido con id ${id}`);
  }

  private async handleMissingPedido<T>(
    id: number,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isMissingPrismaRecord(error)) {
        throw this.pedidoNotFound(id);
      }

      throw error;
    }
  }
}
