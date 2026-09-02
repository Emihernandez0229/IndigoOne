function generarCredencial(prefijo) {
  const numero = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
  return `${prefijo.toUpperCase()}${numero}`;
}

async function generarCredencialUnica(prefijo, existeFn, intentos = 5) {
  for (let i = 0; i < intentos; i++) {
    const candidato = generarCredencial(prefijo);
    const yaExiste = await existeFn(candidato);
    if (!yaExiste) return candidato;
  }
  const err = new Error('No se pudo generar una credencial única, intenta de nuevo');
  err.status = 500;
  throw err;
}

module.exports = { generarCredencial, generarCredencialUnica };