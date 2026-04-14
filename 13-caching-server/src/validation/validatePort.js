/**
 * @file src/validation/validatePort.js
 * @description Validaciones relacionadas con el argumento --port.
 */

'use strict';

const net = require('net');
const { PORT_MIN, PORT_MAX } = require('../constants');

/**
 * Valida que el valor crudo de --port sea un entero dentro del rango permitido.
 *
 * @param {string|undefined} rawPort - Valor recibido desde la CLI.
 * @returns {number} El número de puerto ya parseado y validado.
 * @throws {Error} Si el valor está ausente, no es numérico o está fuera de rango.
 *
 * @example
 * validatePort('3000')  // => 3000
 * validatePort('0')     // throws Error
 * validatePort('abc')   // throws Error
 */
function validatePort(rawPort) {
  if (!rawPort || String(rawPort).trim() === '') {
    throw new Error('El argumento --port es obligatorio.');
  }

  if (!/^\d+$/.test(String(rawPort).trim())) {
    throw new Error(`El puerto "${rawPort}" no es un número válido.`);
  }

  const num = Number(rawPort);

  if (!Number.isInteger(num) || num < PORT_MIN || num > PORT_MAX) {
    throw new Error(
      `El puerto debe ser un entero entre ${PORT_MIN} y ${PORT_MAX}. Recibido: ${num}`
    );
  }

  return num;
}

/**
 * Comprueba de forma asíncrona que el puerto esté libre en localhost.
 * Crea un servidor TCP temporal, intenta escuchar en ese puerto y lo cierra
 * de inmediato. Si el puerto está ocupado, lanza un error descriptivo.
 *
 * @param {number} port - Número de puerto a comprobar.
 * @returns {Promise<true>} Resuelve con `true` si el puerto está disponible.
 * @throws {Error} Si el puerto está en uso o si ocurre cualquier otro error de red.
 *
 * @example
 * await checkPortAvailable(3000); // => true  (si está libre)
 * await checkPortAvailable(80);   // throws Error (probablemente ocupado)
 */
function checkPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`El puerto ${port} ya está en uso. Elige otro puerto.`));
      } else {
        reject(new Error(`Error comprobando el puerto ${port}: ${err.message}`));
      }
    });

    tester.once('listening', () => {
      // El puerto estaba libre; cerramos el servidor de prueba y confirmamos.
      tester.close(() => resolve(true));
    });

    tester.listen(port, '127.0.0.1');
  });
}

module.exports = { validatePort, checkPortAvailable };
