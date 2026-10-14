import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';

@Module({
  controllers: [ProductosController],
  providers: [ProductosService, PrismaService],
})
export class ProductosModule {}
