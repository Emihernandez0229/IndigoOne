// Sanitizadores de texto para inputs controlados: se usan como
// transformacion en el onChange para que el usuario fisicamente no pueda
// teclear caracteres invalidos, en vez de solo marcar error al enviar.
// Todas devuelven el valor ya recortado a `maxLength` cuando se indica.

const LETTERS = "a-zA-ZÀ-ÖØ-öø-ÿÑñ";

export function onlyLetters(value, maxLength) {
  const clean = value.replace(new RegExp(`[^${LETTERS}\\s]`, "g"), "");
  return maxLength ? clean.slice(0, maxLength) : clean;
}

export function onlyLettersAndDots(value, maxLength) {
  const clean = value.replace(new RegExp(`[^${LETTERS}.\\s]`, "g"), "");
  return maxLength ? clean.slice(0, maxLength) : clean;
}

export function onlyDigits(value, maxLength) {
  const clean = value.replace(/\D/g, "");
  return maxLength ? clean.slice(0, maxLength) : clean;
}

export function alphanumericSpaces(value, maxLength) {
  const clean = value.replace(new RegExp(`[^${LETTERS}0-9\\s]`, "g"), "");
  return maxLength ? clean.slice(0, maxLength) : clean;
}

export function alphanumericDotSpaces(value, maxLength) {
  const clean = value.replace(new RegExp(`[^${LETTERS}0-9.\\s]`, "g"), "");
  return maxLength ? clean.slice(0, maxLength) : clean;
}

// RFC: letras y numeros, letras siempre en mayuscula.
export function rfcInput(value, maxLength) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return maxLength ? clean.slice(0, maxLength) : clean;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(value);
}

export function isValidPostalCode(value) {
  return /^\d{5}$/.test(value);
}
