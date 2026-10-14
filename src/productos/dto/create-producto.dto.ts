export class CreateProductoDto {
  nombre!: string;
  precio!: number;
  descripcion!: string;
  stock?: number;
  categoria?: string | null;
}
