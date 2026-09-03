import { describe, it, expect } from "vitest";

import {
  getRoleConfig,
  getHomePathForRole,
  getNavigationForRole,
} from "./roleConfig";
import { ROLES } from "./roles";


describe("roleConfig", () => {

  it("cada rol Indigo entra por /indigo/dashboard", () => {
    expect(getHomePathForRole(ROLES.INDIGO_OWNER)).toBe("/indigo/dashboard");
    expect(getHomePathForRole(ROLES.INDIGO_BRANCH_MANAGER)).toBe("/indigo/dashboard");
    expect(getHomePathForRole(ROLES.INDIGO_SALES)).toBe("/indigo/dashboard");
    expect(getHomePathForRole(ROLES.INDIGO_LAB)).toBe("/indigo/dashboard");
  });

  it("cada rol Optica entra por /opticas/dashboard", () => {
    expect(getHomePathForRole(ROLES.OPTICA_OWNER)).toBe("/opticas/dashboard");
    expect(getHomePathForRole(ROLES.OPTICA_EMPLOYEE)).toBe("/opticas/dashboard");
  });

  it("un rol desconocido cae en /login", () => {
    expect(getHomePathForRole("NOPE")).toBe("/login");
  });

  it("asigna el modulo correcto", () => {
    expect(getRoleConfig(ROLES.INDIGO_OWNER).module).toBe("indigo");
    expect(getRoleConfig(ROLES.OPTICA_OWNER).module).toBe("opticas");
  });

  it("la navegacion Indigo incluye Sucursales y Usuarios", () => {
    const paths = getNavigationForRole(ROLES.INDIGO_OWNER).map((item) => item.path);
    expect(paths).toContain("/indigo/sucursales");
    expect(paths).toContain("/indigo/usuarios");
  });

  it("devuelve [] de navegacion para rol desconocido", () => {
    expect(getNavigationForRole("NOPE")).toEqual([]);
  });

});
