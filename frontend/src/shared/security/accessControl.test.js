import { describe, it, expect } from "vitest";

import {hasPermission,hasAnyPermission,hasAllPermissions,getPermissionsForRole} from "./accessControl";
import { ROLES} from "./roles";


describe("hasPermission", () => {

  it("es true cuando el permiso esta en la lista", () => {
    expect(hasPermission(["sales.view", "sales.create"], "sales.view")).toBe(true);
  });

  it("es false cuando el permiso no esta", () => {
    expect(hasPermission(["sales.view"], "sales.create")).toBe(false);
  });

  it("es true cuando no se pide ningun permiso", () => {
    expect(hasPermission(["sales.view"], undefined)).toBe(true);
    expect(hasPermission([], null)).toBe(true);
  });

  it("no rompe con lista por defecto", () => {
    expect(hasPermission(undefined, "sales.view")).toBe(false);
  });

});


describe("hasAnyPermission", () => {

  it("es true si tiene al menos uno", () => {
    expect(hasAnyPermission(["a"], ["a", "b"])).toBe(true);
  });

  it("es false si no tiene ninguno", () => {
    expect(hasAnyPermission(["c"], ["a", "b"])).toBe(false);
  });

  it("es true si la lista pedida esta vacia", () => {
    expect(hasAnyPermission([], [])).toBe(true);
  });

});


describe("hasAllPermissions", () => {

  it("es true si tiene todos", () => {
    expect(hasAllPermissions(["a", "b", "c"], ["a", "b"])).toBe(true);
  });

  it("es false si falta uno", () => {
    expect(hasAllPermissions(["a"], ["a", "b"])).toBe(false);
  });

  it("es true si la lista pedida esta vacia", () => {
    expect(hasAllPermissions([], [])).toBe(true);
  });

});


describe("getPermissionsForRole", () => {

  it("devuelve los permisos del dueno Indigo", () => {
    const permissions = getPermissionsForRole(ROLES.INDIGO_DUENO);
    expect(permissions).toContain("branch.view");
    expect(permissions).toContain("user.view");
    expect(permissions).toContain("reports.global");
  });

  it("ventas y laboratorio no pueden ver usuarios ni sucursales", () => {
    expect(getPermissionsForRole(ROLES.INDIGO_EMPLEADO_VENTAS)).not.toContain("user.view");
    expect(getPermissionsForRole(ROLES.INDIGO_EMPLEADO_VENTAS)).not.toContain("branch.view");
    expect(getPermissionsForRole(ROLES.INDIGO_EMPLEADO_LABORATORIO)).not.toContain("user.view");
    expect(getPermissionsForRole(ROLES.INDIGO_EMPLEADO_LABORATORIO)).not.toContain("branch.view");
  });

  it("el gerente de sucursal puede ver sucursales y usuarios", () => {
    const permissions = getPermissionsForRole(ROLES.INDIGO_GERENTE_SUCURSAL);
    expect(permissions).toContain("branch.view");
    expect(permissions).toContain("user.view");
  });

  it("devuelve [] para un rol desconocido", () => {
    expect(getPermissionsForRole("NOPE")).toEqual([]);
  });

});