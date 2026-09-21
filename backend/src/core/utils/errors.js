

class AppError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
        this.isOperational = true;
        // Mantiene correctamente el nombre de la clase
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
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

class UnauthorizedError extends AppError {
    constructor(message = 'No autenticado') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'No tienes permisos para realizar esta acción') {
        super(message, 403);
    }
}

class ConflictError extends AppError {
    constructor(message = 'El recurso ya existe o entra en conflicto') {
        super(message, 409);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Los datos proporcionados no son válidos', errors=null) {
        super(message, 422);
        this.errors = errors;
    }
}
module.exports = {
    AppError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    ValidationError,
};   