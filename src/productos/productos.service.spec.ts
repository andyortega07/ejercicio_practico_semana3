import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { productos } from './BaseDatos';
import { ProductosService } from './productos.service';

describe('ProductosService', () => {
  let service: ProductosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductosService],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
    productos.splice(0, productos.length);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and lists products with generated ids', () => {
    const primero = service.create({
      nombre: 'Teclado',
      precio: 30,
      descripcion: 'Teclado mecánico',
    });
    const segundo = service.create({
      nombre: 'Mouse',
      precio: 15,
      descripcion: 'Mouse inalámbrico',
    });

    expect(primero.id).toBe(1);
    expect(segundo.id).toBe(2);
    expect(service.findAll()).toEqual([primero, segundo]);
  });

  it('finds a product by id', () => {
    const creado = service.create({
      nombre: 'Monitor',
      precio: 200,
      descripcion: 'Monitor 27 pulgadas',
    });

    expect(service.findOne(creado.id)).toBe(creado);
  });

  it('updates only the provided product fields', () => {
    const creado = service.create({
      nombre: 'Monitor',
      precio: 200,
      descripcion: 'Monitor 27 pulgadas',
    });

    const actualizado = service.update(creado.id, { precio: 180 });

    expect(actualizado).toEqual({
      id: creado.id,
      nombre: 'Monitor',
      precio: 180,
      descripcion: 'Monitor 27 pulgadas',
    });
  });

  it('removes a product from the stored list', () => {
    const creado = service.create({
      nombre: 'Monitor',
      precio: 200,
      descripcion: 'Monitor 27 pulgadas',
    });

    expect(service.remove(creado.id)).toBe(creado);
    expect(service.findAll()).toEqual([]);
  });

  it('throws when a product does not exist', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
    expect(() => service.update(999, { precio: 1 })).toThrow(NotFoundException);
    expect(() => service.remove(999)).toThrow(NotFoundException);
  });
});
