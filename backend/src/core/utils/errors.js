

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;

        // Mantiene correctamente el nombre de la clase
        this.name = this.constructor.name;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Recurso') {
        super(`${resource} no encontrado`, 404);
    }
}

class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

export {
    AppError,
    NotFoundError,
    BadRequestError
};