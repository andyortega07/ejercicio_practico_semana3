export class Pedido {
  id!: number;
  estado!: string;
  cantidad!: number;

  constructor(id: number, estado: string, cantidad: number) {
    this.id = id;
    this.estado = estado;
    this.cantidad = cantidad;
  }
}
