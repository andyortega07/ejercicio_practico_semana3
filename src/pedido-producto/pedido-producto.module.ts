import { Module } from '@nestjs/common';
import { PedidoProductoService } from './pedido-producto.service';
import { PedidoProductoController } from './pedido-producto.controller';

@Module({
  controllers: [PedidoProductoController],
  providers: [PedidoProductoService],
})
export class PedidoProductoModule {}
