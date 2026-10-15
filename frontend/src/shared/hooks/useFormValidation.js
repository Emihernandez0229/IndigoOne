import { useCallback, useState } from "react";


/**
 * Centraliza el patron que vivia copiado en cada formulario: juntar
 * errores en un objeto, guardarlos, y cancelar el submit si hay alguno.
 *
 *   const { errors, validate, clearError, resetErrors } = useFormValidation();
 *
 *   const set = (field, transform) => (event) => {
 *     ...
 *     clearError(field);
 *   };
 *
 *   const handleSubmit = async (event) => {
 *     event.preventDefault();
 *     const isValid = validate([
 *       ["name", !form.name.trim(), "El nombre es obligatorio."],
 *       ["phone", !isValidPhone(form.phone), "El teléfono debe tener 10 dígitos."],
 *     ]);
 *     if (!isValid) return;
 *     ...
 *   };
 *
 * Cada entrada de `validate` es [campo, condicion_de_error, mensaje]. Si dos
 * entradas comparten el mismo campo, la ULTIMA que resulte invalida es la
 * que queda (mismo orden que el `nextErrors[field] = ...` que reemplaza).
 */
export function useFormValidation() {
  const [errors, setErrors] = useState({});

  const validate = useCallback((checks) => {
    const nextErrors = {};
    checks.forEach(([field, isInvalid, message]) => {
      if (isInvalid) nextErrors[field] = message;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, []);

  const clearError = useCallback((field) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const clearErrors = useCallback((fields) => {
    setErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => { next[field] = undefined; });
      return next;
    });
  }, []);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, setErrors, validate, clearError, clearErrors, resetErrors };
}
