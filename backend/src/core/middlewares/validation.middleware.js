const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                campo: issue.path.join('.') || issue.keys?.join(', ') || 'general',
                mensaje: issue.message
            }));

            return next(
                new ValidationError(
                    'Los datos proporcionados no son válidos',
                    errors
                )
            );
        }

        req.body = result.data;
        next();
    };
};

module.exports = validate;