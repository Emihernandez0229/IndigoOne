import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getOpticaInfo } from "../../opticas/optica/services/opticaService";
import { shadeHex } from "../utils/colorShade";

const OPTICA_ROLE_PREFIX = "optica:";

const OpticaBrandThemeContext = createContext({ style: undefined, applyColors: () => {} });

/**
 * Para usuarios de Ópticas, expone un estilo con las variables CSS de marca
 * sobreescritas con el color principal y secundario que la óptica eligió en
 * Identidad visual: --color-indigo-primary (botones/texto) y sus tonos
 * derivados --color-indigo-dark (fondo del sidebar) y --color-indigo-secondary
 * (item activo del sidebar) a partir del mismo colorPrincipal, más
 * --color-indigo-light (acentos) desde colorSecundario. Tailwind genera sus
 * utilidades (bg-indigo-primary, bg-indigo-dark, etc.) con var(...), así que
 * aplicar este estilo en la raíz del layout repinta todo el módulo -
 * incluido el sidebar - al instante en cuanto se guarda un color, sin tocar
 * Indigo: los usuarios de Indigo nunca tienen role "optica:*", así que para
 * ellos `style` queda undefined y el azul original no cambia.
 */
export function OpticaBrandThemeProvider({ role, children }) {

  const isOptica = typeof role === "string" && role.startsWith(OPTICA_ROLE_PREFIX);
  const [colors, setColors] = useState(null);

  useEffect(() => {
    if (!isOptica) return undefined;

    let active = true;
    getOpticaInfo()
      .then((info) => {
        if (active && info) setColors({ colorPrincipal: info.colorPrincipal, colorSecundario: info.colorSecundario });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isOptica]);

  const applyColors = useCallback((partial) => {
    setColors((prev) => ({ ...prev, ...partial }));
  }, []);

  const style = useMemo(() => {
    if (!isOptica || !colors) return undefined;
    const vars = {};
    if (colors.colorPrincipal) {
      vars["--color-indigo-primary"] = colors.colorPrincipal;
      vars["--color-indigo-dark"] = shadeHex(colors.colorPrincipal, -22);
      vars["--color-indigo-secondary"] = shadeHex(colors.colorPrincipal, 14);
    }
    if (colors.colorSecundario) vars["--color-indigo-light"] = colors.colorSecundario;
    return vars;
  }, [isOptica, colors]);

  const value = useMemo(() => ({ style, applyColors }), [style, applyColors]);

  return (
    <OpticaBrandThemeContext.Provider value={value}>
      {children}
    </OpticaBrandThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOpticaBrandTheme() {
  return useContext(OpticaBrandThemeContext);
}
