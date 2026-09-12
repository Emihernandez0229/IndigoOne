// ICONOS DEL NAVBAR

import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Bell,
  MapPin,
  LogOut,
} from "lucide-react"

import {
  useAuth
} from "../context/AuthContext";

import { getRoleConfig } from "../security/roleConfig";

// NAVBAR PRINCIPAL

export default function Navbar() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const roleLabel =
    getRoleConfig(user?.role)?.label ?? user?.role ?? "Rol";

  const initials =
    (user?.name ?? "Usuario")
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header
      className="
        flex
        h-20
        shrink-0
        items-center
        justify-between
        border-b
        border-gray-200
        bg-surface
        px-6
        lg:px-8
      "
    >
      {/* INFORMACIÓN DEL SISTEMA */}

      <div>
        <p
          className="
            text-lg
            font-semibold
            text-text-primary
          "
        >
          Indigo One
        </p>

        <p
          className="
            hidden
            text-xs
            text-text-secondary
            sm:block
          "
        >
          Sistema Integral de Gestión
        </p>
      </div>

      {/* ÁREA DERECHA */}

      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        {/* SUCURSAL ACTIVA */}

        <div
          className="
            hidden
            items-center
            gap-2
            rounded-xl
            bg-indigo-light
            px-3
            py-2
            md:flex
          "
        >
          <MapPin
            className="
              h-4
              w-4
              text-indigo-primary
            "
          />

          <span
            className="
              text-sm
              font-medium
              text-indigo-primary
            "
          >
            {user?.branch?.name ?? "Sin sucursal"}
          </span>
        </div>

        {/* NOTIFICACIONES */}

        <button
          type="button"
          className="
            relative
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-text-secondary
            transition
            hover:bg-indigo-light
            hover:text-indigo-primary
          "
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />

          {/* INDICADOR DE NOTIFICACIÓN */}

          <span
            className="
              absolute
              right-2
              top-2
              h-2
              w-2
              rounded-full
              bg-error
            "
          />
        </button>

        {/* SEPARADOR */}

        <div
          className="
            hidden
            h-8
            w-px
            bg-gray-200
            sm:block
          "
        />

        {/* PERFIL DEL USUARIO */}

        <div className="relative" ref={menuRef}>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              p-1
              pr-2
              transition
              hover:bg-background
            "
          >
            {/* AVATAR */}

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-indigo-primary
                text-sm
                font-semibold
                text-white
              "
            >
              {initials}
            </div>

            {/* NOMBRE Y ROL */}

            <div
              className="
                hidden
                text-left
                sm:block
              "
            >
              <p
                className="
                  text-sm
                  font-semibold
                  text-text-primary
                "
              >
                {user?.name ?? "Usuario"}
              </p>

              <p
                className="
                  text-xs
                  text-text-secondary
                "
              >
                {roleLabel}
              </p>
            </div>
          </button>

          {/* MENU DESPLEGABLE */}

          {menuOpen && (

            <div
              className="
                absolute
                right-0
                top-full
                z-20
                mt-2
                w-48
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-surface
                shadow-lg
              "
            >
              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-error
                  transition
                  hover:bg-background
                "
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>

          )}

        </div>
      </div>
    </header>
  )
}