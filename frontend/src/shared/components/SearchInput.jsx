import { Search } from "lucide-react";


/**
 * Campo de busqueda controlado.
 *   <SearchInput value={q} onChange={setQ} placeholder="Buscar por ID o nombre" />
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}) {

  return (

    <div className={`relative ${className}`}>

      <Search
        className="
          pointer-events-none
          absolute
          left-3
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-text-secondary
        "
      />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-gray-200
          bg-surface
          py-2.5
          pl-9
          pr-4
          text-sm
          text-text-primary
          outline-none
          transition
          placeholder:text-text-secondary
          focus:border-indigo-primary
          focus:ring-2
          focus:ring-indigo-light
        "
      />

    </div>

  );

}
