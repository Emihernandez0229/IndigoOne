import { X } from "lucide-react";


/**
 * Panel de detalle acoplado al lado derecho del contenido (no es un overlay).
 * Se usa como hermano flex del contenido principal: al abrirse, el contenido
 * principal se encoge (gracias a `flex-1 min-w-0` + transition) y el panel
 * se desliza desde la derecha con su propio ancho fijo. Al cerrarse, el
 * contenido principal regresa a su ancho original.
 *   <div className="flex gap-6 items-start">
 *     <div className="min-w-0 flex-1 transition-all duration-300">...</div>
 *     <SidePanel isOpen={open} onClose={...} title="Detalle">...</SidePanel>
 *   </div>
 */
export default function SidePanel({ isOpen, onClose, title, children, width = "420px" }) {

  return (
    <div
      className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: isOpen ? width : "0px", opacity: isOpen ? 1 : 0 }}
      aria-hidden={!isOpen}
    >
      <div style={{ width }} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-surface shadow-sm">

        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-text-secondary transition hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

      </div>
    </div>
  );

}
