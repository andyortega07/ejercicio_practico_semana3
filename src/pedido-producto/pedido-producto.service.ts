import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePedidoProductoDto } from './dto/create-pedido-producto.dto';
import { UpdatePedidoProductoDto } from './dto/update-pedido-producto.dto';
import { PrismaService } from '../prisma/prisma.service';
import { isMissingPrismaRecord } from '../prisma/prisma-errors';

@Injectable()
export class PedidoProductoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPedidoProductoDto: CreatePedidoProductoDto) {
    return this.prisma.pedidoproducto.create({
      data: createPedidoProductoDto,
    });
  }

  findAll() {
    return this.prisma.pedidoproducto.findMany();
  }

  async findOne(id: number) {
    const pedidoProducto = await this.prisma.pedidoproducto.findUnique({
      where: { id },
    });
    if (!pedidoProducto) {
      throw this.pedidoProductoNotFound(id);
    }

    return pedidoProducto;
  }

  update(id: number, updatePedidoProductoDto: UpdatePedidoProductoDto) {
    return this.handleMissingPedidoProducto(id, () =>
      this.prisma.pedidoproducto.update({
        where: { id },
        data: updatePedidoProductoDto,
      }),
    );
  }

  remove(id: number) {
    return this.handleMissingPedidoProducto(id, () =>
      this.prisma.pedidoproducto.delete({ where: { id } }),
    );
  }

  private pedidoProductoNotFound(id: number): NotFoundException {
    return new NotFoundException(
      `No se encontró el producto del pedido con id ${id}`,
    );
  }

  private async handleMissingPedidoProducto<T>(
    id: number,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isMissingPrismaRecord(error)) {
        throw this.pedidoProductoNotFound(id);
      }

      throw error;
    }
  }
}
