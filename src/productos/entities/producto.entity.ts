export class Producto {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;

  constructor(id: number, nombre: string, precio: number, descripcion: string) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.descripcion = descripcion;
  }
}
