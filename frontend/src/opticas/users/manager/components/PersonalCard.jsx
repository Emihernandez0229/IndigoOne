import { useEffect, useRef, useState } from "react";
import { Eye, Pencil, MoreVertical, Ban, RotateCcw } from "lucide-react";

import StatusBadge from "../../../../shared/components/StatusBadge";
import { USER_ROLE_LABELS } from "../../constants";


export default function PersonalCard({ user, branchName, canDeactivate = true, onView, onEdit, onDeactivate, onActivate }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-5">

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-light text-base font-bold text-indigo-primary">
            {(user.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-text-primary">{user.name}</p>
            <StatusBadge status={user.status} label={user.status === "active" ? "Activo" : "Inactivo"} />
          </div>
        </div>

        {canDeactivate && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-text-secondary transition hover:bg-background"
              aria-label="Más acciones"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg">
                {user.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDeactivate(); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-error transition hover:bg-background"
                  >
                    <Ban className="h-4 w-4" />
                    Dar de baja
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onActivate(); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-success transition hover:bg-background"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Dar de alta
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary">Rol</dt>
          <dd className="font-medium text-text-primary">{USER_ROLE_LABELS[user.role] ?? user.role}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary">Usuario</dt>
          <dd className="font-medium text-text-primary">{user.username || "—"}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary">Sucursal</dt>
          <dd className="font-medium text-text-primary">{branchName || "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-sm font-medium">
        <button type="button" onClick={onView} className="flex items-center gap-1.5 text-indigo-primary hover:underline">
          <Eye className="h-4 w-4" />
          Ver detalles
        </button>
        <button type="button" onClick={onEdit} className="flex items-center gap-1.5 text-indigo-primary hover:underline">
          <Pencil className="h-4 w-4" />
          Editar
        </button>
      </div>

    </div>
  );

}
