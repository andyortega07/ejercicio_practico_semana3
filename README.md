<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Prisma and PostgreSQL

`npm install` genera el cliente Prisma automáticamente. La URL de conexión se
declara en `prisma/schema.prisma` mediante `DATABASE_URL`; no hace falta definirla
para generar el cliente ni para usar las reservas en memoria. Si está definida,
Prisma comprueba la conexión al arrancar. Productos y pedidos siguen necesitando
PostgreSQL para sus operaciones.

Set `DATABASE_URL` in `.env` to the connection string for your PostgreSQL database.
The Prisma schema and migration history are in `prisma/`.

```bash
# Generate the Prisma Client
$ npm run prisma:generate

# Apply migrations during local development
$ npm run prisma:migrate

# Check migration status
$ npm run prisma:status
```

For deployment, apply the checked-in migrations with `npm run prisma:deploy`.

## Pedidos (Postman)

Inicia la API con `npm run start:dev`. En Postman usa `Content-Type: application/json`.

Primero crea un producto con `POST http://localhost:3000/productos`:

```json
{
  "nombre": "Teclado",
  "precio": 30,
  "descripcion": "Mecánico",
  "stock": 5
}
```

Con el ID obtenido, crea un pedido con `POST http://localhost:3000/pedido`:

```json
{
  "idcliente": 1,
  "idproducto": 1,
  "cantidad": 2
}
```

El pedido inicia como `Pendiente` y descuenta la cantidad del stock en la misma transacción. Producto inexistente o inventario insuficiente responden `422`; un cliente con otro pedido pendiente responde `409`. Los cuerpos inválidos también responden `422`.

Endpoints públicos:

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/productos` | Crear producto |
| GET | `/productos` | Listar productos |
| GET | `/productos/:id` | Consultar producto |
| PATCH | `/productos/:id` | Actualizar producto |
| DELETE | `/productos/:id` | Eliminar producto sin pedidos asociados |
| POST | `/pedido` | Crear pedido pendiente |
| GET | `/pedido` | Listar pedidos con productos |
| GET | `/pedido/:id` | Consultar pedido con productos |
| PATCH | `/pedido/:id` | Cambiar de `Pendiente` a `entregado` o `negado` |
| DELETE | `/pedido/:id` | Eliminar pedido finalizado |

Para cambiar el estado: `PATCH http://localhost:3000/pedido/1` con `{ "estado": "entregado" }` o `{ "estado": "negado" }`. Un pedido negado devuelve la cantidad al inventario. Los pedidos finalizados no pueden volver a estado pendiente. Para eliminar uno pendiente, primero niégalo o entrégalo. El modelo Prisma `PedidoProducto` es la entidad intermedia entre pedido y producto y se almacena en la tabla existente `pedidoproducto`. `/pedido-producto` no es una ruta pública: la relación se administra desde `/pedido` para proteger las reglas de inventario.

Después de incorporar nuevas migraciones, ejecuta `npm run prisma:deploy` antes de iniciar la API. La migración de índice único garantiza que tampoco puedan coexistir dos pedidos pendientes del mismo cliente bajo solicitudes simultáneas.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Reservas del laboratorio

Las reservas se guardan en un arreglo del controlador y se reinician con la
aplicación. La API usa Express y no tiene prefijo global ni interceptores que
envuelvan las respuestas.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `http://localhost:3000/reservas` | 200, todas las reservas |
| GET | `http://localhost:3000/reservas?laboratorio=Lab%202` | 200, coincidencia exacta |
| GET | `http://localhost:3000/reservas/:id` | 200, reserva; 404 si no existe |
| POST | `http://localhost:3000/reservas` | 201, objeto y cabecera `Location` |
| DELETE | `http://localhost:3000/reservas/:id` | 204 sin cuerpo; 404 si no existe |

Ejemplo de POST:

```json
{ "docente": "Rosa Ortiz", "laboratorio": "Lab 3", "hora": 14 }
```

El controlador valida primero docente, laboratorio y tipo de hora; después,
existencia del laboratorio, rango horario y disponibilidad. El lector JSON
permite valores nulos o primitivos para que también reciban el mensaje de datos
incompletos del controlador. El ID lo asigna el servidor después de validar.

Para reproducir las pruebas, compila y arranca una instancia limpia en una terminal:

```bash
npm install
npm run build
npm run start
```

En otra terminal, sin hacer solicitudes previas ni reiniciar durante la prueba:

```bash
node test/reservas-http.cjs
```

La prueba ejecuta los nueve casos obligatorios en orden y luego los casos
adicionales. Guarda las solicitudes y respuestas reales en
`test/evidencia-reservas.json`; el caso 9 contiene juntos el DELETE y el GET
posterior. Las creaciones adicionales dejan reservas en memoria, por lo que
debes reiniciar la aplicación antes de repetir la prueba completa.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
