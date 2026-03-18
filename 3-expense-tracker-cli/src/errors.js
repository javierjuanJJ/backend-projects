/**
 * @file src/errors.js
 * @description Clases de error personalizadas para la aplicación.
 *              Permite distinguir errores de negocio de errores inesperados del sistema.
 */

'use strict';

/**
 * Error base de la aplicación.
 * Todos los errores controlados deben extender esta clase.
 */
class AppError extends Error {
    /**
     * @param {string} message - Mensaje descriptivo del error.
     * @param {string} [hint]  - Sugerencia de uso para el usuario.
     */
    constructor(message, hint = null) {
        super(message);
        this.name = 'AppError';
        this.hint = hint;
    }
}

/**
 * Error de validación de argumentos de línea de comandos.
 */
class ArgumentError extends AppError {
    constructor(message, hint = null) {
        super(message, hint);
        this.name = 'ArgumentError';
    }
}

/**
 * Error cuando no se encuentra un recurso (p.e. un gasto por ID).
 */
class NotFoundError extends AppError {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * Error relacionado con operaciones de fichero (lectura/escritura/CSV).
 */
class FileError extends AppError {
    constructor(message) {
        super(message);
        this.name = 'FileError';
    }
}

module.exports = { AppError, ArgumentError, NotFoundError, FileError };
