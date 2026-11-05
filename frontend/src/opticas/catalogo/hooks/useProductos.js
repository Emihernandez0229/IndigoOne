import { useEffect, useMemo, useState } from "react";

import { useCrudResource, prepend, mergeById } from "../../../shared/hooks/useCrudResource";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";

import { listBranches } from "../../branches/services/branchService";
import { listStockPorSucursales, ajustarStock } from "../../inventory/services/inventoryService";
import {
  listProductos,
  createProducto,
  updateProducto,
  deactivateProducto,
  activateProducto,
} from "../services/catalogoService";


export default function useProductos() {

  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === ROLES.OPTICA_DUENO;

  const { data: productosBase, loading, error, reload, create, update, deactivate, activate } = useCrudResource({
    list: listProductos,
    numbered: true,
    mutations: {
      create: { fn: createProducto, apply: prepend },
      update: { fn: updateProducto, apply: mergeById },
      deactivate: { fn: deactivateProducto, apply: mergeById },
      activate: { fn: activateProducto, apply: mergeById },
    },
  });

  // El catalogo (productos) no trae existencias - esas viven en el modulo
  // Stock, por sucursal. Aqui se completa cada producto con su
  // "stockPorSucursal" pidiendole al Stock la existencia de cada sucursal
  // (Dueño: todas las suyas) o solo la propia (Encargado/Empleado), y
  // uniendolo por producto_id - asi el resto de la app (tabla, detalle,
  // Nueva venta, dashboards, reportes) sigue viendo el mismo campo de
  // siempre sin tener que saber de donde salio.
  const [stockMap, setStockMap] = useState(new Map());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const branchIds = isOwner
          ? (await listBranches()).map((b) => b.id)
          : currentUser?.sucursalId
            ? [currentUser.sucursalId]
            : [];
        const map = await listStockPorSucursales(branchIds);
        if (active) setStockMap(map);
      } catch {
        // El catalogo sigue siendo usable sin existencias si esto falla.
      }
    })();
    return () => {
      active = false;
    };
  }, [isOwner, currentUser?.sucursalId]);

  const productos = useMemo(
    () => productosBase.map((p) => ({ ...p, stockPorSucursal: stockMap.get(p.id) ?? [] })),
    [productosBase, stockMap]
  );

  const registerMovimiento = async (productId, branchId, payload) => {
    const { stock } = await ajustarStock(productId, { branchId, ...payload });
    setStockMap((prev) => {
      const next = new Map(prev);
      const rows = next.get(productId) ?? [];
      const nuevaCantidad = Number(stock?.cantidad ?? 0);
      const yaExiste = rows.some((row) => row.branchId === branchId);
      next.set(
        productId,
        yaExiste
          ? rows.map((row) => (row.branchId === branchId ? { ...row, stock: nuevaCantidad } : row))
          : [...rows, { branchId, stock: nuevaCantidad }]
      );
      return next;
    });
  };

  return { productos, loading, error, reload, create, update, deactivate, activate, registerMovimiento };
}
