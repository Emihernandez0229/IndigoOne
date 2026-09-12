import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";
import {listAvailableManagers} from "../services/branchService";


const NEW_MANAGER = "__nuevo__";


const EMPTY = {
  name: "",
  address: "",
  managerId: "",
  manager: "",
  managerMode: "none",
  phone: "",
};


function crearFormDesdeSucursal(branch) {

  if (!branch) {
    return {
      ...EMPTY
    };
  }


  return {
    ...EMPTY,
    name:
      branch.name ?? "",
    address:
      branch.address ?? "",
    managerId:
      branch.managerId ?? "",
    manager:
      branch.manager ?? "",
    managerMode:
      branch.managerId
        ? "existing"
        : "none",
    phone:
      branch.phone ?? "",
  };
}


export default function BranchFormModal({
  open,
  mode = "create",
  branch = null,
  onClose,
  onSubmit,
}) {

  const [form, setForm] =
    useState(
      () => crearFormDesdeSucursal(branch)
    );

  const [errors, setErrors] =
    useState({});
  const [saving, setSaving] =
    useState(false);
  const [managers, setManagers] =
    useState([]);
  const [loadingManagers, setLoadingManagers] =
    useState(false);
  const { user: currentUser } = useAuth();

  const readOnly =
    mode === "view";
  const isEdit =
    mode === "edit";

  const isGerenteEditor =
    isEdit &&
    currentUser?.role === ROLES.INDIGO_GERENTE_SUCURSAL;

  const lockNameAndManager =
    readOnly || isGerenteEditor;


  const titles = {
    create: "Nueva sucursal",
    edit: "Editar sucursal",
    view: "Detalle de sucursal",
  };


  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      crearFormDesdeSucursal(branch)
    );
    setErrors({});
  }, [
    open,
    branch
  ]);


  useEffect(() => {

    if (!open || readOnly || isGerenteEditor) {
      return;
    }

    let active = true;

    (async () => {

      try {
        setLoadingManagers(true);
        const data =
          await listAvailableManagers(
            isEdit
              ? branch?.managerId
              : null
          );
        if (active) {
          setManagers(
            Array.isArray(data)
              ? data
              : []
          );
        }

      } catch (error) {
        console.error(
          "Error al cargar gerentes:",
          error
        );
        if (active) {
          setManagers([]);
        }
      } finally {
        if (active) {
          setLoadingManagers(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [
    open,
    readOnly,
    isGerenteEditor,
    isEdit,
    branch?.managerId
  ]);

  const set = (field) => (event) => {

    const value =
      event?.target
        ? event.target.value
        : event;

    setForm((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));

  };


  const handleManagerChange = (event) => {
    const value =
      event.target.value;


    if (value === NEW_MANAGER) {
      setForm((prev) => ({
        ...prev,
        managerMode:
          "new",
        managerId:
          "",
        manager:
          "",
      }));
      setErrors((prev) => ({
        ...prev,
        manager: undefined,
      }));
      return;
    }

    if (value === "") {
      setForm((prev) => ({
        ...prev,
        managerMode:
          "none",
        managerId:
          "",
        manager:
          "",
      }));
      setErrors((prev) => ({
        ...prev,
        manager: undefined,
      }));
      return;
    }

    const selected =
      managers.find(
        (manager) =>
          manager.id === value
      );


    setForm((prev) => ({
      ...prev,
      managerMode:
        "existing",
      managerId:
        value,
      manager:
        selected?.nombre ?? "",
    }));

    setErrors((prev) => ({
      ...prev,
      manager: undefined,
    }));
  };

  const handleNewManagerChange = (event) => {

    const value =
      event.target.value;

    setForm((prev) => ({
      ...prev,
      manager:
        value,
      managerMode:
        "new",
      managerId:
        "",
    }));


    if (value.trim()) {
      setErrors((prev) => ({
        ...prev,
        manager: undefined,
      }));
    }
  };

  const cancelNewManager = () => {
    setForm(
      crearFormDesdeSucursal(branch)
    );
    setErrors({});
  };

  const handleSubmit = async (event) => {

    event.preventDefault();


    const nextErrors = {};


    const name =
      String(
        form.name ?? ""
      ).trim();

    const address =
      String(
        form.address ?? ""
      ).trim();

    const phone =
      String(
        form.phone ?? ""
      ).trim();

    const manager =
      String(
        form.manager ?? ""
      ).trim();

    if (!name) {
      nextErrors.name =
        "El nombre es obligatorio.";
    }

    if (
      form.managerMode === "new" &&
      !manager
    ) {

      nextErrors.manager =
        "El nombre del gerente es obligatorio.";
    }


    setErrors(
      nextErrors
    );

    if (
      Object.keys(nextErrors).length > 0
    ) {
      return;
    }


    try {
      setSaving(true);

      await onSubmit({
        name,
        address,
        managerId:
          form.managerId || null,
        manager,
        managerMode:
          form.managerMode,
        phone,
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={titles[mode]}
      size="lg"
    >

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* Nombre */}

        <Input
          label="Nombre de sucursal"
          value={form.name ?? ""}
          onChange={set("name")}
          error={errors.name}
          disabled={lockNameAndManager}
        />


        {/* Dirección */}

        <Input
          label="Dirección"
          value={form.address ?? ""}
          onChange={set("address")}
          error={errors.address}
          disabled={readOnly}
        />


        {/* Responsable + teléfono */}

        <div className="grid gap-4 sm:grid-cols-2">

          {/* Responsable */}

          {lockNameAndManager ? (

            <div className="w-full">

              <span
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-text-primary
                "
              >
                Responsable
              </span>


              <div
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-surface
                  px-4
                  py-3
                  text-text-primary
                  opacity-50
                "
              >
                {
                  form.manager ||
                  "Sin asignar"
                }
              </div>

            </div>

          ) : form.managerMode === "new" ? (

            <div className="w-full">
              <label
                htmlFor="branch-new-manager"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-text-primary"
              >
                Responsable
              </label>


              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="branch-new-manager"
                    value={
                      form.manager ?? ""
                    }
                    onChange={
                      handleNewManagerChange
                    }
                    error={
                      errors.manager
                    }
                    placeholder="Nombre del gerente"
                    autoFocus
                  />
                </div>


                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    cancelNewManager
                  }
                >
                  Cancelar
                </Button>

              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-text-secondary "
              >
                Se creará automaticamente
                como gerente de sucursal.
              </p>

            </div>

          ) : (

            <div className="w-full">

              <label
                htmlFor="branch-manager"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-text-primary
                "
              >
                Responsable
              </label>


              <select
                id="branch-manager"
                value={
                  form.managerId ?? ""
                }
                onChange={
                  handleManagerChange
                }
                disabled={
                  loadingManagers
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-surface
                  px-4
                  py-3
                  text-text-primary
                  outline-none
                  transition
                  focus:border-indigo-primary
                  focus:ring-2
                  focus:ring-indigo-light
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                <option value="">
                  {
                    loadingManagers
                      ? "Cargando..."
                      : "Sin asignar"
                  }
                </option>


                {managers.map(
                  (manager) => (

                    <option
                      key={manager.id}
                      value={manager.id}
                    >
                      {manager.nombre}
                    </option>
                  )
                )}

                <option
                  value={NEW_MANAGER}
                >
                  Nuevo gerente de sucursal
                </option>
              </select>


              {managers.length === 0 &&
                !loadingManagers && (

                  <p
                    className="
                      mt-1
                      text-xs
                      text-text-secondary
                    "
                  >
                    No hay gerentes disponibles.
                  </p>
                )}
            </div>
          )}

          {/* Teléfono */}

          <Input
            label="Teléfono"
            value={form.phone ?? ""}
            onChange={set("phone")}
            disabled={readOnly}
          />

        </div>

        {/* Botones */}

        <div
          className="
            flex
            justify-end
            gap-3
            pt-2
          "
        >

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {
              readOnly
                ? "Cerrar"
                : "Cancelar"
            }
          </Button>
          {!readOnly && (

            <Button
              type="submit"
              disabled={saving}
            >
              {
                saving
                  ? "Guardando..."
                  : "Guardar"
              }
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
