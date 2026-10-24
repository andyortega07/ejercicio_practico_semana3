import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Response } from 'express';

interface Reserva {
  id: number;
  laboratorio: string;
  docente: string;
  hora: number;
}

@Controller('reservas')
export class ReservasController {
  private reservas: Reserva[] = [
    { id: 1, laboratorio: 'Lab 1', docente: 'Marta Loja', hora: 8 },
    { id: 2, laboratorio: 'Lab 2', docente: 'Luis Paredes', hora: 10 },
  ];
  private siguienteId = 3;

  @Get()
  listar(@Query('laboratorio') laboratorio?: string): Reserva[] {
    if (laboratorio === undefined) return this.reservas;
    return this.reservas.filter(
      (reserva) => reserva.laboratorio === laboratorio,
    );
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number): Reserva {
    return this.buscar(id);
  }

  @Post()
  crear(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Reserva {
    const datos: Record<string, unknown> =
      body !== null && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};

    if (typeof datos.docente !== 'string' || !datos.docente.trim()) {
      throw new BadRequestException('El docente es obligatorio');
    }
    if (typeof datos.laboratorio !== 'string' || !datos.laboratorio.trim()) {
      throw new BadRequestException('El laboratorio es obligatorio');
    }
    if (typeof datos.hora !== 'number' || !Number.isInteger(datos.hora)) {
      throw new BadRequestException('La hora debe ser un número entero');
    }

    const docente = datos.docente.trim();
    const laboratorio = datos.laboratorio.trim();
    const hora = datos.hora;

    if (!['Lab 1', 'Lab 2', 'Lab 3'].includes(laboratorio)) {
      throw new UnprocessableEntityException(
        `El laboratorio "${laboratorio}" no existe`,
      );
    }
    if (hora < 7 || hora > 18) {
      throw new UnprocessableEntityException(
        'Solo se reserva entre las 7:00 y las 18:00',
      );
    }
    if (
      this.reservas.some(
        (reserva) =>
          reserva.laboratorio === laboratorio && reserva.hora === hora,
      )
    ) {
      throw new ConflictException(
        `${laboratorio} ya está reservado a las ${hora}:00`,
      );
    }

    const reserva: Reserva = {
      id: this.siguienteId,
      laboratorio,
      docente,
      hora,
    };
    this.reservas.push(reserva);
    this.siguienteId++;
    res.setHeader('Location', `/reservas/${reserva.id}`);
    return reserva;
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id', ParseIntPipe) id: number): void {
    this.buscar(id);
    this.reservas = this.reservas.filter((reserva) => reserva.id !== id);
  }

  private buscar(id: number): Reserva {
    const reserva = this.reservas.find((item) => item.id === id);
    if (!reserva) {
      throw new NotFoundException(`No existe la reserva ${id}`);
    }
    return reserva;
  }
}
