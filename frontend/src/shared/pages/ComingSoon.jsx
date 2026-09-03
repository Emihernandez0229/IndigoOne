import { Hammer } from "lucide-react";

import PageContainer from "../layouts/PageContainer";

export default function ComingSoon({ title = "Módulo" }) {

  return (

    <PageContainer
      title={title}
      description="Esta sección está en construcción."
    >

      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          gap-3
          rounded-2xl
          border
          border-dashed
          border-gray-300
          bg-surface
          p-12
          text-center
        "
      >

        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-indigo-light
          "
        >
          <Hammer className="h-6 w-6 text-indigo-primary" />
        </div>

        <p className="font-semibold text-text-primary">
          Próximamente
        </p>

        <p className="max-w-sm text-sm text-text-secondary">
          Estamos trabajando en esta pantalla. La estructura ya está
          preparada para conectarla con el backend.
        </p>

      </div>

    </PageContainer>

  );

}
