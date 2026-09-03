import AuthLayout from "../components/AuthLayout"
import LoginForm from "../components/LoginForm"

// PÁGINA DE INICIO DE SESIÓN

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bienvenido"
      description={
        <>
          Inicia sesión para acceder a{" "}
          <span className="font-semibold text-indigo-dark">
            Indigo One.
          </span>
        </>
      }
      footer={
        <p className="text-center text-text-secondary">
          © 2026 Indigo · Todos los derechos reservados{" "}

         
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}