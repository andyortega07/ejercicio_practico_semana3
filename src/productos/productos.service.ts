import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from '../prisma/prisma.service';

type Producto = NonNullable<
  Awaited<ReturnType<PrismaService['producto']['findUnique']>>
>;

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProductoDto: CreateProductoDto): Promise<Producto> {
    return this.prisma.producto.create({ data: createProductoDto });
  }

  findAll(): Promise<Producto[]> {
    return this.prisma.producto.findMany();
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw this.productNotFound(id);
    }

    return producto;
  }

  update(id: number, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    return this.handleMissingProduct(id, () =>
      this.prisma.producto.update({
        where: { id },
        data: updateProductoDto,
      }),
    );
  }

  remove(id: number): Promise<Producto> {
    return this.handleMissingProduct(id, () =>
      this.prisma.producto.delete({ where: { id } }),
    );
  }

  private productNotFound(id: number): NotFoundException {
    return new NotFoundException(`No se encontró el producto con id ${id}`);
  }

  private async handleMissingProduct<T>(
    id: number,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isMissingRecordError(error)) {
        throw this.productNotFound(id);
      }

      throw error;
    }
  }
}

function isMissingRecordError(
  error: unknown,
): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'P2025'
  );
}
