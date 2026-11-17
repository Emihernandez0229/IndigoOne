export const TAX_REGIMES = [
  { value: "general_personas_morales", label: "General de Ley Personas Morales" },
  { value: "regimen_simplificado", label: "Régimen Simplificado de Confianza" },
  { value: "persona_fisica_actividad_empresarial", label: "Persona Física con Actividad Empresarial" },
];

export const BRAND_COLORS = [
  { name: "Azul índigo", principal: "#29347A", secundario: "#C7CCEA" },
  { name: "Verde", principal: "#16A34A", secundario: "#BBF7D0" },
  { name: "Rojo", principal: "#DC2626", secundario: "#FECACA" },
  { name: "Naranja", principal: "#F97316", secundario: "#FED7AA" },
  { name: "Azul celeste", principal: "#0EA5E9", secundario: "#BAE6FD" },
  { name: "Gris", principal: "#6B7280", secundario: "#E5E7EB" },
  { name: "Amarillo ocre", principal: "#B8860B", secundario: "#F0E0B0" },
  { name: "Púrpura", principal: "#9333EA", secundario: "#E9D5FF" },
  { name: "Marrón", principal: "#7C4A1E", secundario: "#E3C9A8" },
];

/**
 * Paleta fija de colores de icono, independiente del color de marca de la
 * óptica (colorPrincipal/colorSecundario) - para que los iconos de
 * Información general/fiscal/Identidad visual se vean variados en vez de
 * seguir siempre el mismo color secundario elegido.
 */
export const ICON_TONES = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  sky: { bg: "bg-sky-100", text: "text-sky-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
};

export { MEXICAN_STATES, COUNTRIES } from "../../shared/constants/locations";
