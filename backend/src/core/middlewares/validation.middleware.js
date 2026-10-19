const { ValidationError } = require('../utils/errors');

const validate = (schema, fuente = 'body') => {
    return (req, res, next) => {
        const datos = req[fuente];
        const result = schema.safeParse(datos);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                campo: issue.path.join('.') || 'general',
                mensaje: issue.message,
            }));
            return next(new ValidationError('Los datos proporcionados no son válidos', errors));
        }

        if (fuente === 'query') {
            // Express 5: req.query es un getter de solo lectura que re-parsea
            // la URL en cada acceso. Object.assign no persiste el cambio.
            // Se sobreescribe la propiedad en la instancia para que
            // los siguientes accesos usen los datos ya validados.
            Object.defineProperty(req, 'query', {
                value: result.data,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        } else {
            req[fuente] = result.data;
        }

        next();
    };
};

module.exports = validate;