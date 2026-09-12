import {useEffect,useState} from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

import {getUserFormOptions} from "../services/userService";


const NEW_BRANCH =
  "__nueva_sucursal__";


const EMPTY = {
  name: "",
  role: "",
  branchId: "",
  newBranch: false,
  newBranchName: "",
};


function crearFormDesdeUsuario(
  user
) {

  if (!user) {
    return {
      ...EMPTY,
    };
  }


  return {
    ...EMPTY,

    name:
      user.name ?? "",
    role:
      user.role ?? "",
    branchId:
      user.branchId ?? "",
    newBranch:
      false,
    newBranchName:
      "",
  };

}


export default function UserFormModal({
  open,
  mode = "create",
  user = null,
  onClose,
  onSubmit,
}) {

  const [
    form,
    setForm,
  ] = useState(
    () =>
      crearFormDesdeUsuario(
        user
      )
  );


  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(false);

  const [
    roles,
    setRoles,
  ] = useState([]);

  const [
    branches,
    setBranches,
  ] = useState([]);

  const [
    managerBranches,
    setManagerBranches,
  ] = useState([]);

  const isEdit =
    mode === "edit";

  const title =
    isEdit
      ? "Editar usuario"
      : "Nuevo usuario";

  useEffect(() => {

    if (!open) {
      return;
    }

    setForm(
      crearFormDesdeUsuario(
        user
      )
    );

    setErrors({});

  }, [
    open,
    user,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function cargarOpciones() {

      try {
        setLoadingOptions(true);

        const data =
          await getUserFormOptions(
            isEdit
              ? user?.id
              : null
          );

        if (!active) {
          return;
        }

        setRoles(
          Array.isArray(
            data?.roles
          )
            ? data.roles
            : []
        );

        setBranches(
          Array.isArray(
            data?.sucursales
          )
            ? data.sucursales
            : []
        );

        setManagerBranches(
          Array.isArray(
            data?.sucursalesGerente
          )
            ? data.sucursalesGerente
            : []
        );

      } catch (error) {

        console.error(
          "Error al cargar opciones de usuarios:",
          error
        );

        if (active) {

          setRoles([]);
          setBranches([]);
          setManagerBranches([]);

        }

      } finally {

        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    cargarOpciones();

    return () => {
      active = false;
    };

  }, [
    open,
    isEdit,
    user?.id,
  ]);

  const set = (field) => (
    event
  ) => {

    const value =
      event?.target
        ? event.target.value
        : event;

    setForm((prev) => ({
      ...prev,

      [field]:
        value ?? "",
    }));

    setErrors((prev) => ({
      ...prev,

      [field]:
        undefined,
    }));

  };


  const handleRoleChange = (
    event
  ) => {

    const role =
      event.target.value;


    setForm((prev) => ({
      ...prev,

      role,

      branchId: "",

      newBranch: false,

      newBranchName: "",
    }));

    setErrors({});
  };


  const handleBranchChange = (
    event
  ) => {

    const value =
      event.target.value;

    if (
      value ===
      NEW_BRANCH
    ) {

      setForm((prev) => ({
        ...prev,

        branchId: "",
        newBranch: true,
        newBranchName: "",
      }));


      setErrors((prev) => ({
        ...prev,
        branchId:
          undefined,
        newBranchName:
          undefined,
      }));


      return;
    }


    setForm((prev) => ({
      ...prev,

      branchId:
        value,
      newBranch:
        false,
      newBranchName:
        "",
    }));


    setErrors((prev) => ({
      ...prev,

      branchId:
        undefined,
      newBranchName:
        undefined,
    }));

  };


  const handleNewBranchChange = (
    event
  ) => {

    const value =
      event.target.value;


    setForm((prev) => ({
      ...prev,
      newBranchName:
        value,
      newBranch:
        true,
      branchId:
        "",
    }));


    if (
      value.trim()
    ) {

      setErrors((prev) => ({
        ...prev,
        newBranchName:
          undefined,
      }));

    }

  };


  const cancelNewBranch = () => {

    setForm((prev) => ({
      ...prev,
      branchId:
        "",
      newBranch:
        false,
      newBranchName:
        "",
    }));


    setErrors((prev) => ({
      ...prev,
      branchId:
        undefined,
      newBranchName:
        undefined,
    }));

  };


  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const nextErrors = {};

    const name =
      String(
        form.name ?? ""
      ).trim();

    const newBranchName =
      String(
        form.newBranchName ?? ""
      ).trim();

    if (!name) {
      nextErrors.name =
        "El nombre es obligatorio.";
    }

    if (!form.role) {
      nextErrors.role =
        "Selecciona un rol.";

    }

    const roleRequiresBranch =
      form.role ===
        "INDIGO_BRANCH_MANAGER" ||
      form.role ===
        "INDIGO_SALES" ||
      form.role ===
        "INDIGO_LAB";

    if (
      roleRequiresBranch &&
      !form.newBranch &&
      !form.branchId
    ) {
      nextErrors.branchId =
        "Selecciona una sucursal.";
    }

    if (
      form.newBranch &&
      form.role !==
        "INDIGO_BRANCH_MANAGER"
    ) {
      nextErrors.branchId =
        "Solo los gerentes pueden crear una nueva sucursal.";
    }

    if (
      form.newBranch &&
      !newBranchName
    ) {
      nextErrors.newBranchName =
        "El nombre de la sucursal es obligatorio.";
    }

    setErrors(
      nextErrors
    );

    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {
      return;
    }

    try {
      setSaving(true);
      await onSubmit({

        name,
        role:
          form.role,
        branchId:
          form.branchId || null,
        newBranch:
          form.newBranch,
        newBranchName:
          newBranchName || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentBranchOptions =
    form.role ===
      "INDIGO_BRANCH_MANAGER"
      ? managerBranches
      : branches;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="lg"
    >

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={
              form.name
            }
            onChange={
              set("name")
            }
            disabled={
              isEdit
            }
            error={
              errors.name
            }
          />


          <div className="w-full">
            <label
              htmlFor="user-role"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-text-primary
              "
            >
              Rol
            </label>
            <select
              id="user-role"
              value={
                form.role
              }
              onChange={
                handleRoleChange
              }
              disabled={
                loadingOptions
              }
              className={
                selectClass
              }
            >
              <option value="">
                {
                  loadingOptions
                    ? "Cargando..."
                    : "Selecciona..."
                }
              </option>


              {
                roles.map(
                  (role) => (

                    <option
                      key={
                        role.value
                      }
                      value={
                        role.value
                      }
                    >
                      {
                        role.label
                      }
                    </option>

                  )
                )
              }

            </select>


            {
              errors.role && (

                <p
                  className="
                    mt-1.5
                    text-sm
                    text-error
                  "
                >
                  {
                    errors.role
                  }
                </p>

              )
            }

          </div>

        </div>


        <div className="w-full">

          {
            form.newBranch ? (

              <div>

                <label
                  htmlFor="new-user-branch"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-text-primary
                  "
                >
                  Sucursal
                </label>


                <div className="flex gap-2">

                  <div className="flex-1">

                    <Input
                      id="new-user-branch"
                      value={
                        form.newBranchName
                      }
                      onChange={
                        handleNewBranchChange
                      }
                      error={
                        errors.newBranchName
                      }
                      placeholder="Nombre de la sucursal"
                      autoFocus
                    />

                  </div>


                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      cancelNewBranch
                    }
                  >
                    Cancelar
                  </Button>

                </div>


                <p
                  className="
                    mt-1
                    text-xs
                    text-text-secondary
                  "
                >
                  Se creará automáticamente
                  la sucursal y se asignará
                  este usuario como gerente.
                </p>

              </div>

            ) : (

              <div>

                <label
                  htmlFor="user-branch"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-text-primary
                  "
                >
                  Sucursal
                </label>


                <select
                  id="user-branch"
                  value={
                    form.branchId
                  }
                  onChange={
                    handleBranchChange
                  }
                  disabled={
                    loadingOptions
                  }
                  className={
                    selectClass
                  }
                >

                  <option value="">
                    {
                      loadingOptions
                        ? "Cargando..."
                        : "Selecciona..."
                    }
                  </option>


                  {
                    currentBranchOptions.map(
                      (option) => (

                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>

                      )
                    )
                  }


                  {
                    form.role ===
                      "INDIGO_BRANCH_MANAGER" && (

                      <option
                        value={
                          NEW_BRANCH
                        }
                      >
                        Nueva sucursal
                      </option>

                    )
                  }

                </select>

                {
                  errors.branchId && (
                    <p
                      className="
                        mt-1.5
                        text-sm
                        text-error
                      "
                    >
                      {
                        errors.branchId
                      }
                    </p>

                  )
                }

                {
                  form.role ===
                    "INDIGO_BRANCH_MANAGER" &&
                  currentBranchOptions.length === 0 &&
                  !loadingOptions && (
                    <p
                      className="
                        mt-1
                        text-xs
                        text-text-secondary
                      "
                    >
                      No hay sucursales disponibles
                      para asignar un gerente.
                    </p>
                  )
                }

              </div>

            )
          }

        </div>


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
            onClick={
              onClose
            }
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={
              saving ||
              loadingOptions
            }
          >
            {
              saving
                ? "Guardando..."
                : "Guardar"
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}


const selectClass = `
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
`;
