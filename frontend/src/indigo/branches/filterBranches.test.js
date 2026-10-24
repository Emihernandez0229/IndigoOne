import { describe, it, expect } from "vitest";

import { filterBranches } from "./filterBranches";


describe("filterBranches", () => {

  it("sin filtros devuelve todo", () => {
    expect(filterBranches(branches)).toHaveLength(3);
  });

  it("busca por ID exacto", () => {
    expect(filterBranches(branches, { query: "2" })).toEqual([branches[1]]);
  });

  it("busca por nombre parcial e insensible a mayusculas", () => {
    expect(filterBranches(branches, { query: "norte" })).toEqual([branches[1]]);
    expect(filterBranches(branches, { query: "SUCURSAL" })).toHaveLength(3);
  });

  it("filtra por estado", () => {
    expect(filterBranches(branches, { status: "inactive" })).toEqual([branches[2]]);
  });

  it("combina texto y estado", () => {
    expect(
      filterBranches(branches, { query: "sucursal", status: "active" })
    ).toHaveLength(2);
  });

});
