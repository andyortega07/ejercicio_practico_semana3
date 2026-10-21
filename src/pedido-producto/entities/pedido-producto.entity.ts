export class PedidoProducto {
  id!: number;
  idpedido!: number;
  idproducto!: number;

  constructor(id: number, idpedido: number, idproducto: number) {
    this.id = id;
    this.idpedido = idpedido;
    this.idproducto = idproducto;
  }
}
