import { describe, it, expect } from "vitest";

import { scopeByBranch, hasGlobalBranchScope } from "./dataScope";


const rows = [
  { id: 1, branchId: 1 },
  { id: 2, branchId: 2 },
  { id: 3, branchId: 3 },
];


describe("scopeByBranch", () => {

  it("devuelve todo cuando branchIds es null (dueño Indigo)", () => {
    const user = { branchIds: null };
    expect(scopeByBranch(rows, user)).toHaveLength(3);
  });

  it("devuelve todo cuando el usuario no tiene branchIds", () => {
    expect(scopeByBranch(rows, {})).toHaveLength(3);
  });

  it("filtra a las sucursales del jefe", () => {
    const user = { branchIds: [1, 2] };
    const result = scopeByBranch(rows, user);
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it("acepta un extractor de id de sucursal personalizado", () => {
    const users = [
      { id: "a", sucursal: 1 },
      { id: "b", sucursal: 9 },
    ];
    const result = scopeByBranch(users, { branchIds: [1] }, (u) => u.sucursal);
    expect(result).toEqual([{ id: "a", sucursal: 1 }]);
  });

});


describe("hasGlobalBranchScope", () => {

  it("true para dueño (sin branchIds)", () => {
    expect(hasGlobalBranchScope({ branchIds: null })).toBe(true);
    expect(hasGlobalBranchScope({})).toBe(true);
  });

  it("false para jefe con sucursales acotadas", () => {
    expect(hasGlobalBranchScope({ branchIds: [1] })).toBe(false);
  });

});
