import { UnprocessableEntityException } from '@nestjs/common';

export function requireObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new UnprocessableEntityException('El cuerpo debe ser un objeto JSON');
  }
  return value as Record<string, unknown>;
}

export function allowedFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): void {
  const unexpected = Object.keys(value).find((key) => !fields.includes(key));
  if (unexpected) {
    throw new UnprocessableEntityException(`Campo no permitido: ${unexpected}`);
  }
}

export function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new UnprocessableEntityException(
      `${field} debe ser un entero positivo`,
    );
  }
  return value;
}

export function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new UnprocessableEntityException(
      `${field} debe ser un entero no negativo`,
    );
  }
  return value;
}

export function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new UnprocessableEntityException(
      `${field} debe ser un texto no vacío`,
    );
  }
  return value.trim();
}
