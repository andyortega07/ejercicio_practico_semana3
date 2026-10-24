import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  allowedFields,
  positiveInteger,
  requireObject,
} from '../common/request-validation';

@Injectable()
export class PedidoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePedidoDto) {
    const body = requireObject(dto);
    allowedFields(body, ['idcliente', 'idproducto', 'cantidad', 'estado']);
    const idcliente = positiveInteger(body.idcliente, 'idcliente');
    const idproducto = positiveInteger(body.idproducto, 'idproducto');
    const cantidad = positiveInteger(body.cantidad, 'cantidad');
    if (
      body.estado !== undefined &&
      this.normalizeEstado(body.estado) !== 'Pendiente'
    ) {
      throw new UnprocessableEntityException(
        'Un pedido nuevo debe iniciar Pendiente',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const producto = await tx.producto.findUnique({
          where: { id: idproducto },
        });
        if (!producto) {
          throw new UnprocessableEntityException(
            `No existe el producto con id ${idproducto}`,
          );
        }
        const pedidoPendiente = await tx.pedido.findFirst({
          where: { idcliente, estado: 'Pendiente' },
        });
        if (pedidoPendiente) {
          throw new ConflictException(
            `El cliente ${idcliente} ya tiene un pedido pendiente`,
          );
        }
        const stockActualizado = await tx.producto.updateMany({
          where: { id: idproducto, stock: { gte: cantidad } },
          data: { stock: { decrement: cantidad } },
        });
        if (stockActualizado.count === 0) {
          throw new UnprocessableEntityException(
            `Inventario insuficiente para el producto con id ${idproducto}`,
          );
        }
        return tx.pedido.create({
          data: {
            idcliente,
            cantidad,
            estado: 'Pendiente',
            pedidoProductos: { create: { idproducto } },
          },
          include: { pedidoProductos: { include: { producto: true } } },
        });
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException(
          `El cliente ${idcliente} ya tiene un pedido pendiente`,
        );
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.pedido.findMany({
      include: { pedidoProductos: { include: { producto: true } } },
    });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { pedidoProductos: { include: { producto: true } } },
    });
    if (!pedido) {
      throw this.pedidoNotFound(id);
    }

    return pedido;
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto) {
    const body = requireObject(updatePedidoDto);
    allowedFields(body, ['estado']);
    const estado = this.normalizeEstado(body.estado);
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: { pedidoProductos: true },
      });
      if (!pedido) throw this.pedidoNotFound(id);
      if (pedido.estado === estado) {
        return tx.pedido.findUniqueOrThrow({
          where: { id },
          include: { pedidoProductos: { include: { producto: true } } },
        });
      }
      if (pedido.estado !== 'Pendiente' || estado === 'Pendiente') {
        throw new ConflictException(
          'Un pedido finalizado no puede cambiar de estado',
        );
      }

      const updated = await tx.pedido.updateMany({
        where: { id, estado: 'Pendiente' },
        data: { estado },
      });
      if (updated.count === 0) {
        throw new ConflictException('El pedido ya cambió de estado');
      }
      if (estado === 'negado') {
        for (const item of pedido.pedidoProductos) {
          await tx.producto.update({
            where: { id: item.idproducto },
            data: { stock: { increment: pedido.cantidad } },
          });
        }
      }
      return tx.pedido.findUniqueOrThrow({
        where: { id },
        include: { pedidoProductos: { include: { producto: true } } },
      });
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id } });
      if (!pedido) throw this.pedidoNotFound(id);
      if (pedido.estado === 'Pendiente') {
        throw new ConflictException(
          'Finaliza o niega el pedido antes de eliminarlo',
        );
      }
      await tx.pedidoProducto.deleteMany({ where: { idpedido: id } });
      return tx.pedido.delete({ where: { id } });
    });
  }

  private pedidoNotFound(id: number): NotFoundException {
    return new NotFoundException(`No se encontró el pedido con id ${id}`);
  }

  private normalizeEstado(
    estado: unknown,
  ): 'Pendiente' | 'entregado' | 'negado' {
    const normalized =
      typeof estado === 'string' ? estado.trim().toLowerCase() : '';
    const value =
      normalized === 'pendiente'
        ? 'Pendiente'
        : normalized === 'entregado'
          ? 'entregado'
          : normalized === 'negado'
            ? 'negado'
            : undefined;
    if (!value) {
      throw new UnprocessableEntityException(
        'El estado debe ser Pendiente, entregado o negado',
      );
    }
    return value;
  }
}
