# Manejo de errores

## Ubicación

Los errores personalizados se encuentran en:

```text
src/core/utils/errors.js
```

La documentación correspondiente se encuentra en:

```text
docs/manejo-de-errores/errors.md
```

## Errores personalizados

`errors.js` contiene las clases utilizadas para representar errores controlados dentro de la aplicación.

| Error               | HTTP | Uso                                           |
| ------------------- | ---: | --------------------------------------------- |
| `BadRequestError`   |  400 | Solicitud o datos inválidos                   |
| `UnauthorizedError` |  401 | Usuario no autenticado                        |
| `ForbiddenError`    |  403 | Usuario sin permisos                          |
| `NotFoundError`     |  404 | Recurso no encontrado                         |
| `ConflictError`     |  409 | Conflicto con el estado actual                |
| `ValidationError`   |  422 | Datos que no cumplen las reglas de validación |
| `AppError`          |  500 | Error base de la aplicación                   |

## Uso

Los servicios pueden lanzar errores personalizados cuando una operación no puede continuar.

```js
if (!paciente) {
    throw new NotFoundError('Paciente');
}
```

El error contiene el código HTTP que será utilizado por el middleware global.

## Middleware de errores

El proyecto utiliza el middleware global de manejo de errores existente:

```js
function manejadorErrores(err, req, res, next) {

    console.error(err);

    const status = err.status || 500;
    const mensaje = err.message || 'Error interno del servidor';

    res.status(status).json({
        error: mensaje
    });
}

module.exports = manejadorErrores;
```

El middleware utiliza `err.status` para determinar el código de respuesta. Si el error no proporciona un código, se utiliza `500`.

## Respuesta

Por ejemplo:

```js
throw new NotFoundError('Paciente');
```

produce:

```json
{
    "error": "Paciente no encontrado"
}
```

Los controladores no necesitan manejar individualmente estos errores, ya que el middleware global se encarga de generar la respuesta HTTP.

## Registro

El middleware se registra después de las rutas:

```js
app.use(routes);
app.use(manejadorErrores);
```
