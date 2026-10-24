// Ejecutar después de un arranque limpio: node test/reservas-http.cjs
const assert = require('node:assert/strict');
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const base = 'http://localhost:3000';
const iniciales = [
  { id: 1, laboratorio: 'Lab 1', docente: 'Marta Loja', hora: 8 },
  { id: 2, laboratorio: 'Lab 2', docente: 'Luis Paredes', hora: 10 },
];
const valida = { docente: 'Rosa Ortiz', laboratorio: 'Lab 3', hora: 14 };
const evidencia = { inicio: new Date().toISOString(), base, casos: [] };
let actual;

async function caso(nombre, probar) {
  actual = { nombre, solicitudes: [], correcto: false };
  evidencia.casos.push(actual);
  await probar();
  actual.correcto = true;
  console.log(`OK: ${nombre}`);
}

async function http(metodo, ruta, estado, body) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const texto = await respuesta.text();
  const resultado = {
    solicitud: { metodo, ruta, body },
    respuesta: {
      estado: respuesta.status,
      location: respuesta.headers.get('location'),
      texto,
      body: texto ? JSON.parse(texto) : null,
    },
  };
  actual.solicitudes.push(resultado);
  assert.equal(respuesta.status, estado);
  return resultado.respuesta;
}

async function error(body, estado, mensaje) {
  const respuesta = await http('POST', '/reservas', estado, body);
  assert.equal(respuesta.body.message, mensaje);
  assert.equal(respuesta.location, null);
}

async function probar() {
  // Los nueve casos obligatorios se ejecutan primero, sin reiniciar el servidor.
  await caso('Caso 1: lista inicial', async () => {
    assert.deepEqual((await http('GET', '/reservas', 200)).body, iniciales);
  });
  await caso('Caso 2: filtro exacto Lab 2', async () => {
    const respuesta = await http('GET', '/reservas?laboratorio=Lab%202', 200);
    assert.deepEqual(respuesta.body, [iniciales[1]]);
  });
  await caso('Caso 3: reserva de Marta Loja', async () => {
    assert.deepEqual(
      (await http('GET', '/reservas/1', 200)).body,
      iniciales[0],
    );
  });
  await caso('Caso 4: reserva 9 inexistente', async () => {
    const respuesta = await http('GET', '/reservas/9', 404);
    assert.equal(respuesta.body.message, 'No existe la reserva 9');
  });
  await caso('Caso 5: crear reserva 3 con Location', async () => {
    const respuesta = await http('POST', '/reservas', 201, valida);
    assert.deepEqual(respuesta.body, { id: 3, ...valida });
    assert.equal(respuesta.location, '/reservas/3');
  });
  await caso('Caso 6: hora ausente', async () => {
    await error(
      { docente: 'Rosa Ortiz', laboratorio: 'Lab 3' },
      400,
      'La hora debe ser un número entero',
    );
  });
  await caso('Caso 7: laboratorio ocupado', async () => {
    await error(
      { docente: 'Ana Paz', laboratorio: 'Lab 1', hora: 8 },
      409,
      'Lab 1 ya está reservado a las 8:00',
    );
  });
  await caso('Caso 8: laboratorio inexistente', async () => {
    await error(
      { docente: 'Ana Paz', laboratorio: 'Lab 9', hora: 8 },
      422,
      'El laboratorio "Lab 9" no existe',
    );
  });
  await caso(
    'Caso 9: DELETE 204 vacío y GET 404 de la misma reserva',
    async () => {
      const eliminada = await http('DELETE', '/reservas/3', 204);
      assert.equal(eliminada.texto, '');
      const consulta = await http('GET', '/reservas/3', 404);
      assert.equal(consulta.body.message, 'No existe la reserva 3');
    },
  );

  const invalidos = [
    [
      'docente vacío',
      { ...valida, docente: '' },
      400,
      'El docente es obligatorio',
    ],
    [
      'docente con espacios',
      { ...valida, docente: '   ' },
      400,
      'El docente es obligatorio',
    ],
    [
      'docente de tipo incorrecto',
      { ...valida, docente: 7 },
      400,
      'El docente es obligatorio',
    ],
    [
      'laboratorio vacío',
      { ...valida, laboratorio: '' },
      400,
      'El laboratorio es obligatorio',
    ],
    [
      'laboratorio con espacios',
      { ...valida, laboratorio: '  ' },
      400,
      'El laboratorio es obligatorio',
    ],
    [
      'laboratorio de tipo incorrecto',
      { ...valida, laboratorio: null },
      400,
      'El laboratorio es obligatorio',
    ],
    [
      'hora decimal',
      { ...valida, hora: 14.5 },
      400,
      'La hora debe ser un número entero',
    ],
    [
      'hora como texto',
      { ...valida, hora: '14' },
      400,
      'La hora debe ser un número entero',
    ],
    [
      'hora nula',
      { ...valida, hora: null },
      400,
      'La hora debe ser un número entero',
    ],
    [
      'hora 6',
      { ...valida, hora: 6 },
      422,
      'Solo se reserva entre las 7:00 y las 18:00',
    ],
    [
      'hora 19',
      { ...valida, hora: 19 },
      422,
      'Solo se reserva entre las 7:00 y las 18:00',
    ],
    [
      'prioridad docente',
      { docente: '', laboratorio: '', hora: '14' },
      400,
      'El docente es obligatorio',
    ],
    [
      'prioridad laboratorio',
      { docente: 'Ana Paz', laboratorio: '', hora: '14' },
      400,
      'El laboratorio es obligatorio',
    ],
    [
      'prioridad tipo de hora',
      { ...valida, laboratorio: 'Lab 9', hora: '14' },
      400,
      'La hora debe ser un número entero',
    ],
    [
      'prioridad existencia del laboratorio',
      { ...valida, laboratorio: 'Lab 9', hora: 6 },
      422,
      'El laboratorio "Lab 9" no existe',
    ],
    ['body ausente', undefined, 400, 'El docente es obligatorio'],
    ['body nulo', null, 400, 'El docente es obligatorio'],
    ['body de texto', 'texto', 400, 'El docente es obligatorio'],
    ['body numérico', 14, 400, 'El docente es obligatorio'],
    ['body booleano', true, 400, 'El docente es obligatorio'],
    ['body arreglo', [], 400, 'El docente es obligatorio'],
  ];
  for (const [nombre, body, estado, mensaje] of invalidos) {
    await caso(`Adicional: ${nombre}`, () => error(body, estado, mensaje));
  }
  for (const metodo of ['GET', 'DELETE']) {
    await caso(`Adicional: ${metodo} con id abc`, async () => {
      await http(metodo, '/reservas/abc', 400);
    });
  }
  await caso('Adicional: DELETE inexistente', async () => {
    const respuesta = await http('DELETE', '/reservas/9', 404);
    assert.equal(respuesta.body.message, 'No existe la reserva 9');
  });
  await caso('Adicional: filtro sin coincidencias y filtro vacío', async () => {
    for (const filtro of ['Lab%209', '', 'lab%202']) {
      const respuesta = await http(
        'GET',
        `/reservas?laboratorio=${filtro}`,
        200,
      );
      assert.deepEqual(respuesta.body, []);
    }
  });
  await caso('Adicional: los errores no guardaron reservas', async () => {
    assert.deepEqual((await http('GET', '/reservas', 200)).body, iniciales);
  });
  await caso(
    'Adicional: contador sin saltos ni reutilización; id del cliente ignorado',
    async () => {
      const respuesta = await http('POST', '/reservas', 201, {
        ...valida,
        id: 999,
        extra: 'ignorar',
      });
      assert.deepEqual(respuesta.body, { id: 4, ...valida });
      assert.equal(respuesta.location, '/reservas/4');
    },
  );
  await caso('Adicional: horas límite 7 y 18', async () => {
    for (const [hora, id] of [
      [7, 5],
      [18, 6],
    ]) {
      const respuesta = await http('POST', '/reservas', 201, {
        ...valida,
        hora,
      });
      assert.deepEqual(respuesta.body, { id, ...valida, hora });
      assert.equal(respuesta.location, `/reservas/${id}`);
    }
  });
}

probar()
  .then(() => {
    evidencia.correcto = true;
    console.log(
      `Completados ${evidencia.casos.length} casos en el mismo servidor.`,
    );
  })
  .catch((error) => {
    evidencia.correcto = false;
    evidencia.error = error.stack;
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    evidencia.fin = new Date().toISOString();
    writeFileSync(
      join(__dirname, 'evidencia-reservas.json'),
      JSON.stringify(evidencia, null, 2) + '\n',
    );
  });
