-- A client may have at most one pending order, including under concurrent requests.
CREATE UNIQUE INDEX "pedido_one_pending_per_client_idx"
ON "pedido" ("idcliente")
WHERE "estado" = 'Pendiente';
