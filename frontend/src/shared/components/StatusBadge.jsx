import { statusStyles } from "../constants/statusStyles";


/**
 * Etiqueta de estado. Usa el catalogo compartido statusStyles.
 * `label` permite sobreescribir el texto (p. ej. "Activo" vs "Activa").
 * Si el estado no existe, cae en "pending".
 */
export default function StatusBadge({ status, label }) {

  const style = statusStyles[status] ?? statusStyles.pending;


  return (

    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${style.className}
      `}
    >
      {label ?? style.label}
    </span>

  );

}
