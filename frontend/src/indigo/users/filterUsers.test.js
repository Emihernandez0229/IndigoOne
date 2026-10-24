import { describe, it, expect } from "vitest";

import { filterUsers } from "./filterUsers";


describe("filterUsers", () => {

  it("sin filtros devuelve todo", () => {
    expect(filterUsers(users)).toHaveLength(3);
  });

  it("busca por nombre", () => {
    expect(filterUsers(users, { query: "ana" })).toEqual([users[0]]);
  });

  it("busca por sucursal", () => {
    expect(filterUsers(users, { query: "norte" })).toEqual([users[2]]);
  });

  it("filtra por rol", () => {
    expect(filterUsers(users, { role: "INDIGO_SALES" })).toHaveLength(2);
  });

  it("filtra por sucursal (id)", () => {
    expect(filterUsers(users, { branch: 1 })).toHaveLength(2);
    expect(filterUsers(users, { branch: "2" })).toEqual([users[2]]);
  });

  it("combina rol y sucursal", () => {
    expect(
      filterUsers(users, { role: "INDIGO_SALES", branch: 1 })
    ).toEqual([users[1]]);
  });

});
