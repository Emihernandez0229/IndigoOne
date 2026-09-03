import { useState } from "react";

import { NavLink } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { filterMenuByPermissions } from "../navigation/filterMenu";

import usePermissions from "../hooks/usePermissions";

export default function Sidebar({ items = [] }) {

  const [isOpen, setIsOpen] = useState(true);

  const { permissions } = usePermissions();


  const menuItems = filterMenuByPermissions(items, permissions);


  return (

    <aside
      className={`
        flex
        h-screen
        flex-col
        bg-indigo-dark
        text-white
        transition-all
        duration-300
        ${isOpen ? "w-[260px]" : "w-[80px]"}
      `}
    >

      {/* HEADER */}

      <div
        className="
          flex
          h-20
          items-center
          justify-between
          border-b
          border-white/10
          px-5
        "
      >

        {
          isOpen && (

            <div>

              <p className="text-lg font-bold">
                INDIGO ONE
              </p>

              <p className="text-xs text-white/60">
                Gestión integral
              </p>

            </div>

          )
        }

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-white/70
            transition
            hover:bg-white/10
            hover:text-white
          "
        >

          {
            isOpen
              ? <ChevronLeft className="h-5 w-5" />
              : <ChevronRight className="h-5 w-5" />
          }

        </button>

      </div>


      {/* MENU */}

      <nav
        className="
          flex-1
          space-y-2
          px-3
          py-6
        "
      >

        {
          menuItems.map((item, index) => {

            // SECCIONES
            if (item.section) {

              return isOpen && (

                <p
                  key={`section-${index}`}
                  className="
                    mt-5
                    mb-2
                    px-3
                    text-xs
                    font-semibold
                    uppercase
                    text-white/40
                  "
                >
                  {item.section}
                </p>

              );

            }


            const Icon = item.icon;


            return (

              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.split("/").length <= 3}
                className={({ isActive }) => `
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition
                  ${
                    isActive
                      ? "bg-indigo-secondary text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
              >

                {Icon && <Icon className="h-5 w-5 shrink-0" />}

                {isOpen && <span>{item.label}</span>}

              </NavLink>

            );

          })
        }

      </nav>


      {/* FOOTER */}

      {
        isOpen && (

          <div
            className="
              border-t
              border-white/10
              px-5
              py-4
            "
          >

            <p className="text-xs text-white/50">
              Indigo One
            </p>

            <p className="text-xs text-white/40">
              Sistema Integral de Gestión
            </p>

          </div>

        )
      }

    </aside>

  );

}
