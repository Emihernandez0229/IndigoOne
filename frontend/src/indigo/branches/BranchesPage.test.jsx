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

// const mockBranches = [
//   { id: 1, name: "Sucursal Centro", address: "Av. Juárez 120", manager: "Ana Ramírez", phone: "555-101-2020", staff: 12, products: 420, status: "active" },
//   { id: 2, name: "Sucursal Norte", address: "Blvd. Norte 45", manager: null, phone: "555-102-3030", staff: 0, products: 0, status: "active" },
// ];

vi.mock("./services/branchService", () => ({
  listBranches: vi.fn(() => Promise.resolve(mockBranches)),
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  deactivateBranch: vi.fn(),
  listAvailableManagers: vi.fn(() => Promise.resolve([])),
  assignManager: vi.fn(),
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
  vi.clearAllMocks();
});


describe("BranchesPage", () => {

  it("el dueno Indigo ve las sucursales y el boton de nueva sucursal", async () => {
    authState.user = {
      role: ROLES.INDIGO_DUENO,
      permissions: getPermissionsForRole(ROLES.INDIGO_DUENO),
    };

    renderPage();

    expect(await screen.findByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Norte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nueva sucursal/i })).toBeInTheDocument();
  });

  it("el gerente de sucursal no puede crear (no tiene el permiso)", async () => {
    authState.user = {
      role: ROLES.INDIGO_GERENTE_SUCURSAL,
      permissions: getPermissionsForRole(ROLES.INDIGO_GERENTE_SUCURSAL),
    };

    renderPage();

    expect(await screen.findByText("Sucursal Centro")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nueva sucursal/i })
    ).not.toBeInTheDocument();
  });

});