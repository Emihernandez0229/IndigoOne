import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import usePermissions from "./usePermissions";


const authState = { user: null };

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authState,
}));


describe("usePermissions", () => {

  it("sin usuario, no puede nada", () => {
    authState.user = null;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("sales.view")).toBe(false);
    expect(result.current.permissions).toEqual([]);
  });

  it("can() usa user.permissions", () => {
    authState.user = { permissions: ["sales.view", "branch.view"] };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("sales.view")).toBe(true);
    expect(result.current.can("user.view")).toBe(false);
  });

  it("canAny y canAll", () => {
    authState.user = { permissions: ["a", "b"] };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAny(["x", "b"])).toBe(true);
    expect(result.current.canAny(["x", "y"])).toBe(false);
    expect(result.current.canAll(["a", "b"])).toBe(true);
    expect(result.current.canAll(["a", "c"])).toBe(false);
  });

  it("can() sin argumento es permisivo", () => {
    authState.user = { permissions: [] };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can()).toBe(true);
  });

});
