import { ShoppingCart, Wrench, FileText } from "lucide-react";


const STEPS = [
  { id: 1, label: "Venta", icon: ShoppingCart },
  { id: 2, label: "Trabajo", icon: Wrench },
  { id: 3, label: "Resumen", icon: FileText },
];


export default function VentaStepper({ step }) {
  return (
    <div className="flex gap-3">
      {STEPS.map(({ id, label, icon: Icon }) => {
        const active = id === step;
        return (
          <div
            key={id}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-sm font-medium transition ${
              active ? "bg-surface text-indigo-primary shadow-sm" : "bg-background text-text-secondary"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{id}. {label}</span>
          </div>
        );
      })}
    </div>
  );
}
