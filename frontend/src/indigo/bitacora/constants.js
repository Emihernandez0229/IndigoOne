import { UserPlus, Pencil, UserX, RotateCcw, KeyRound } from "lucide-react";


export const BITACORA_TYPES = {
  alta_usuario: { label: "Alta de usuario", color: "#22A06B", icon: UserPlus, verb: "creó a" },
  edicion: { label: "Edición", color: "#5565C8", icon: Pencil, verb: "editó a" },
  baja: { label: "Baja", color: "#E5484D", icon: UserX, verb: "dio de baja a" },
  reactivacion: { label: "Reactivación", color: "#14B8A6", icon: RotateCcw, verb: "reactivó a" },
  reseteo_contrasena: { label: "Reseteo de contraseña", color: "#F97316", icon: KeyRound, verb: "restableció la contraseña de" },
};


export const BITACORA_TYPE_FILTERS = [
  { value: "", label: "Todas" },
  { value: "alta_usuario", label: "Alta de usuario" },
  { value: "edicion", label: "Edición" },
  { value: "baja", label: "Baja" },
  { value: "reactivacion", label: "Reactivación" },
  { value: "reseteo_contrasena", label: "Reseteo de contraseña" },
];


export const BITACORA_PERIODS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
  { value: "", label: "Todo" },
];
