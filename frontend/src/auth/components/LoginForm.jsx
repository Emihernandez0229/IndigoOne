import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../shared/components/Button";
import Input from "../../shared/components/Input";
import PasswordInput from "./PasswordInput";
import { useAuth } from "../../shared/context/AuthContext";

export default function LoginForm() {

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const { login } = useAuth();


  const clearError = (field) => {
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const username =
      formData.get("username")?.toString().trim() ?? "";

    const password =
      formData.get("password")?.toString() ?? "";

    const recordarme =
      formData.get("recordarme") !== null;


    const newErrors = {};

    if (!username) {
      newErrors.username = "Ingresa tu usuario.";
    }

    if (!password) {
      newErrors.password = "Ingresa tu contraseña.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }


    try {

      await login({ username, password, recordarme });

      // RoleRedirect decide el dashboard segun el rol del usuario.
      navigate("/", { replace: true });

    } catch (error) {

      console.error("Error de inicio de sesión:", error);

      setErrors({
        username: "Usuario o contraseña incorrectos.",
      });

    }

  };


  return (

    <form className="mt-5" onSubmit={handleSubmit} noValidate>

      <Input
        id="username"
        name="username"
        type="text"
        placeholder="Usuario"
        autoComplete="username"
        error={errors.username}
        onChange={() => clearError("username")}
      />

      <div className="mt-3">
        <PasswordInput
          error={errors.password}
          onChange={() => clearError("password")}
        />
      </div>

      <div className="mt-4 flex items-center">

        <label
          htmlFor="recordarme"
          className="
            flex
            cursor-pointer
            items-center
            gap-2
            text-sm
            text-text-secondary
          "
        >
          <input
            id="recordarme"
            name="recordarme"
            type="checkbox"
            className="h-4 w-4 accent-indigo-primary"
          />
          Recordarme
        </label>

      </div>

      <Button type="submit" className="mt-5 w-full py-3">
        Iniciar sesión
      </Button>

    </form>

  );

}
