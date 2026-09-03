import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import BranchesPage from "./BranchesPage";
import { ROLES } from "../../shared/security/roles";
import { getPermissionsForRole } from "../../shared/security/accessControl";


const authState = { user: null };

vi.mock("../../shared/context/AuthContext", () => ({
  useAuth: () => authState,
}));


function renderPage() {
  return render(
    <MemoryRouter>
      <BranchesPage />
    </MemoryRouter>
  );
}


beforeEach(() => {
  authState.user = null;
});


describe("BranchesPage — alcance por rol", () => {

  it("el dueño Indigo ve todas las sucursales y el boton de nueva sucursal", async () => {
    authState.user = {
      role: ROLES.INDIGO_OWNER,
      branchIds: null,
      permissions: getPermissionsForRole(ROLES.INDIGO_OWNER),
    };

    renderPage();

    expect(await screen.findByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Poniente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nueva sucursal/i })).toBeInTheDocument();
  });

  it("el jefe de sucursal solo ve sus sucursales y no puede crear", async () => {
    authState.user = {
      role: ROLES.INDIGO_BRANCH_MANAGER,
      branchIds: [1, 2],
      permissions: getPermissionsForRole(ROLES.INDIGO_BRANCH_MANAGER),
    };

    renderPage();

    expect(await screen.findByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Norte")).toBeInTheDocument();
    expect(screen.queryByText("Sucursal Poniente")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nueva sucursal/i })
    ).not.toBeInTheDocument();
  });

});
