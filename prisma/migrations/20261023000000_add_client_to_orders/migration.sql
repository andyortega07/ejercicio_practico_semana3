ALTER TABLE "pedido" ADD COLUMN "idcliente" INTEGER;

UPDATE "pedido" SET "idcliente" = "id" WHERE "idcliente" IS NULL;

ALTER TABLE "pedido"
ALTER COLUMN "idcliente" SET NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'Pendiente';

CREATE INDEX "pedido_idcliente_estado_idx" ON "pedido"("idcliente", "estado");
