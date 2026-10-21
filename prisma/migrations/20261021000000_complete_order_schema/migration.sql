-- AlterTable
ALTER TABLE "Producto"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Producto"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "Producto"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "pedido" (
    "id" SERIAL NOT NULL,
    "estado" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidoproducto" (
    "id" SERIAL NOT NULL,
    "idpedido" INTEGER NOT NULL,
    "idproducto" INTEGER NOT NULL,

    CONSTRAINT "pedidoproducto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pedidoproducto"
ADD CONSTRAINT "pedidoproducto_idpedido_fkey"
FOREIGN KEY ("idpedido") REFERENCES "pedido"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidoproducto"
ADD CONSTRAINT "pedidoproducto_idproducto_fkey"
FOREIGN KEY ("idproducto") REFERENCES "Producto"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
