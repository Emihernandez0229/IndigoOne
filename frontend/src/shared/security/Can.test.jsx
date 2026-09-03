import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import Can from "./Can";


// Controlamos los permisos del usuario a traves del hook.
const permissionState = { list: [] };

vi.mock("../hooks/usePermissions", () => ({
  default: () => ({
    permissions: permissionState.list,
    can: (permission) =>
      !permission || permissionState.list.includes(permission),
    canAny: (items = []) =>
      items.length === 0 || items.some((p) => permissionState.list.includes(p)),
    canAll: (items = []) =>
      items.every((p) => permissionState.list.includes(p)),
  }),
}));


beforeEach(() => {
  permissionState.list = [];
});


describe("<Can>", () => {

  it("muestra el contenido cuando tiene el permiso", () => {
    permissionState.list = ["branch.create"];
    render(<Can permission="branch.create"><button>Nueva sucursal</button></Can>);
    expect(screen.getByText("Nueva sucursal")).toBeInTheDocument();
  });

  it("oculta el contenido cuando no tiene el permiso", () => {
    render(<Can permission="branch.create"><button>Nueva sucursal</button></Can>);
    expect(screen.queryByText("Nueva sucursal")).not.toBeInTheDocument();
  });

  it("renderiza el fallback cuando no tiene acceso", () => {
    render(
      <Can permission="branch.create" fallback={<span>Sin acceso</span>}>
        <button>Nueva sucursal</button>
      </Can>
    );
    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
  });

  it("soporta 'all' (exige todos los permisos)", () => {
    permissionState.list = ["laboratory.job.accept"];
    render(
      <Can all={["laboratory.job.accept", "laboratory.job.update"]}>
        <span>Acciones lab</span>
      </Can>
    );
    expect(screen.queryByText("Acciones lab")).not.toBeInTheDocument();

    permissionState.list = ["laboratory.job.accept", "laboratory.job.update"];
    render(
      <Can all={["laboratory.job.accept", "laboratory.job.update"]}>
        <span>Acciones lab 2</span>
      </Can>
    );
    expect(screen.getByText("Acciones lab 2")).toBeInTheDocument();
  });

});
