// Validadores reutilizables para formularios (correo, teléfono, CP, sitio web, RFC).
// Todos regresan true/false; el mensaje de error lo decide el formulario que los usa.

export function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidMexicanPhone(value) {
  if (!value) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length === 10;
}

export function isValidPostalCode(value) {
  if (!value) return true;
  return /^\d{5}$/.test(value.trim());
}

export function isValidUrl(value) {
  if (!value) return true;
  return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#].*)?$/i.test(value.trim());
}

export function isValidRFC(value) {
  if (!value) return true;
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$/i.test(value.trim());
}

export function isValidHexColor(value) {
  if (!value) return true;
  return /^#([0-9A-F]{3}){1,2}$/i.test(value.trim());
}
