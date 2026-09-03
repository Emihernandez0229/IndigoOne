import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Input from "../../shared/components/Input"

// CAMPO DE CONTRASEÑA REUTILIZABLE
// El ojito se pasa como endAdornment del Input compartid

export default function PasswordInput({
  id = "password",
  name = "password",
  placeholder = "Contraseña",
  autoComplete = "current-password",
  error,
  onChange,
}) {

  const [showPassword, setShowPassword] = useState(false)

  return (
    <Input
      id={id}
      name={name}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      autoComplete={autoComplete}
      error={error}
      onChange={onChange}
      endAdornment={
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="
            flex
            items-center
            justify-center
            text-text-secondary
            transition
            hover:text-indigo-primary
          "
          aria-label={
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
          }
        >
          {showPassword
            ? <EyeOff className="h-5 w-5" />
            : <Eye className="h-5 w-5" />}
        </button>
      }
    />
  )

}
