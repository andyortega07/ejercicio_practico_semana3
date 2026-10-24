import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from '../prisma/prisma.service';
import { isMissingPrismaRecord } from '../prisma/prisma-errors';
import {
  allowedFields,
  nonEmptyString,
  nonNegativeInteger,
  requireObject,
} from '../common/request-validation';

type Producto = NonNullable<
  Awaited<ReturnType<PrismaService['producto']['findUnique']>>
>;

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const dto = requireObject(createProductoDto);
    allowedFields(dto, [
      'nombre',
      'precio',
      'descripcion',
      'stock',
      'categoria',
    ]);
    const nombre = nonEmptyString(dto.nombre, 'nombre');
    const descripcion = nonEmptyString(dto.descripcion, 'descripcion');
    const precio = this.validPrice(dto.precio);
    const stock =
      dto.stock === undefined ? 0 : nonNegativeInteger(dto.stock, 'stock');
    const categoria = this.validCategory(dto.categoria);
    return this.prisma.producto.create({
      data: { nombre, precio, descripcion, stock, categoria },
    });
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

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const dto = requireObject(updateProductoDto);
    allowedFields(dto, [
      'nombre',
      'precio',
      'descripcion',
      'stock',
      'categoria',
    ]);
    if (Object.keys(dto).length === 0) {
      throw new UnprocessableEntityException(
        'Indica al menos un campo para actualizar',
      );
    }
    const data: UpdateProductoDto = {};
    if ('nombre' in dto) data.nombre = nonEmptyString(dto.nombre, 'nombre');
    if ('descripcion' in dto)
      data.descripcion = nonEmptyString(dto.descripcion, 'descripcion');
    if ('precio' in dto) data.precio = this.validPrice(dto.precio);
    if ('stock' in dto) data.stock = nonNegativeInteger(dto.stock, 'stock');
    if ('categoria' in dto) data.categoria = this.validCategory(dto.categoria);
    return this.handleMissingProduct(id, () =>
      this.prisma.producto.update({
        where: { id },
        data,
      }),
    );
  }

  remove(id: number): Promise<Producto> {
    return this.handleMissingProduct(id, () =>
      this.prisma.producto.delete({ where: { id } }),
    );
  }

  private validPrice(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new UnprocessableEntityException(
        'precio debe ser un número no negativo',
      );
    }
    return value;
  }

  private validCategory(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    return nonEmptyString(value, 'categoria');
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
      if (isMissingPrismaRecord(error)) {
        throw this.productNotFound(id);
      }

      if (error instanceof Error && 'code' in error && error.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar un producto asociado a pedidos',
        );
      }

      throw error;
    }
  }
}
