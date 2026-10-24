export class Pedido {
  id!: number;
  idcliente!: number;
  estado!: string;
  cantidad!: number;

  constructor(id: number, idcliente: number, estado: string, cantidad: number) {
    this.id = id;
    this.idcliente = idcliente;
    this.estado = estado;
    this.cantidad = cantidad;
  }
}
