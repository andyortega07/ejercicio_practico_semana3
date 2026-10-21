export class Producto {
  id!: number;
  nombre!: string;
  precio!: number;
  descripcion!: string;
  stock!: number;
  categoria!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(
    id: number,
    nombre: string,
    precio: number,
    descripcion: string,
    stock: number,
    categoria: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.descripcion = descripcion;
    this.stock = stock;
    this.categoria = categoria;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
