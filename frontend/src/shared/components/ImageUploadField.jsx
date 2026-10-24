import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";


const DEFAULT_ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml"];


function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


/**
 * Campo de subida de una sola imagen (logo, avatar, etc.), con validación
 * de formato y tamaño máximo. Pensado para reutilizarse en cualquier
 * formulario que necesite una imagen única (a diferencia del carrusel de
 * fotos de Inventario, que maneja varias).
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
  acceptedTypes = DEFAULT_ACCEPTED,
  maxSizeMB = 2,
  buttonLabel = "Cambiar logo",
  disabled = false,
}) {

  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const acceptAttr = acceptedTypes.join(",");
  const formatsLabel = acceptedTypes
    .map((type) => type.split("/")[1]?.replace("svg+xml", "svg").toUpperCase())
    .join(", ");

  const handleSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      setError(`Formato no permitido. Usa ${formatsLabel}.`);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imagen no puede pesar más de ${maxSizeMB}MB.`);
      return;
    }

    setError("");
    onChange(await readFileAsDataUrl(file));
  };


  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      )}

      <div className="flex items-center gap-4">

        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-background">
          {value ? (
            <img src={value} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-text-secondary" />
          )}
        </div>

        <div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-indigo-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel}
          </button>
          <p className="mt-1.5 text-xs text-text-secondary">
            Formatos: {formatsLabel}, máx. {maxSizeMB}MB
          </p>
          {error && <p className="mt-1 text-xs text-error">{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={handleSelect}
        />

      </div>
    </div>
  );
}
