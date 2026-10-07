export const CURRENCIES = [
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "USD", label: "USD - Dólar estadounidense" },
];

export const TAX_REGIMES = [
  { value: "general_personas_morales", label: "General de Ley Personas Morales" },
  { value: "regimen_simplificado", label: "Régimen Simplificado de Confianza" },
  { value: "persona_fisica_actividad_empresarial", label: "Persona Física con Actividad Empresarial" },
];

export const DEFAULT_TAX_OPTIONS = [
  { value: "16", label: "IVA 16%" },
  { value: "8", label: "IVA 8% (frontera)" },
  { value: "0", label: "Exento" },
];

export { MEXICAN_STATES, COUNTRIES } from "../../shared/constants/locations";
