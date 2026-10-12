import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { productos } from './BaseDatos';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  create(createProductoDto: CreateProductoDto): Producto {
    const siguienteId =
      productos.reduce(
        (mayorId, producto) => Math.max(mayorId, producto.id),
        0,
      ) + 1;
    const nuevoProducto = new Producto(
      siguienteId,
      createProductoDto.nombre,
      createProductoDto.precio,
      createProductoDto.descripcion,
    );

    productos.push(nuevoProducto);
    return nuevoProducto;
  }

  findAll(): Producto[] {
    return productos;
  }

  findOne(id: number): Producto {
    const producto = productos.find((producto) => producto.id === id);
    if (!producto) {
      throw new NotFoundException(`No se encontró el producto con id ${id}`);
    }

    return producto;
  }

  update(id: number, updateProductoDto: UpdateProductoDto): Producto {
    const index = productos.findIndex((producto) => producto.id === id);
    if (index === -1) {
      throw new NotFoundException(`No se encontró el producto con id ${id}`);
    }

    Object.assign(productos[index], updateProductoDto);
    return productos[index];
  }

  remove(id: number): Producto {
    const index = productos.findIndex((producto) => producto.id === id);
    if (index === -1) {
      throw new NotFoundException(`No se encontró el producto con id ${id}`);
    }

    return productos.splice(index, 1)[0];
  }
}
