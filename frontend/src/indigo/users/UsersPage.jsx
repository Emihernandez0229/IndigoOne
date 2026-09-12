import {useMemo,useState,} from "react";
import {Plus} from "lucide-react";
import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import Button from "../../shared/components/Button";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";
import {ROLES} from "../../shared/security/roles";
import useUsers from "./hooks/useUsers";
import {filterUsers} from "./filterUsers";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import {INDIGO_USER_ROLES} from "./constants";


export default function UsersPage() {

  const {
    can,
  } =
    usePermissions();

  const {
    users,
    loading,
    error,
    create,
    update,
    deactivate,
    activate,
  } =
    useUsers();


  const [
    confirmAction,
    setConfirmAction,
  ] = useState(null);


  const [
    query,
    setQuery,
  ] = useState("");


  const [
    role,
    setRole,
  ] = useState("");


  const [
    branch,
    setBranch,
  ] = useState("");


  const [
    modal,
    setModal,
  ] = useState({
    open: false,
    mode: "create",
    user: null,
  });


  const branchOptions =
    useMemo(() => {

      const map =
        new Map();


      users.forEach(
        (user) => {

          if (
            user.branchId != null &&
            !map.has(
              user.branchId
            )
          ) {

            map.set(
              user.branchId,
              {
                value:
                  user.branchId,

                label:
                  user.branchName,
              }
            );

          }

        }
      );


      return [
        ...map.values(),
      ];

    }, [
      users,
    ]);


  const filtered =
    useMemo(
      () =>
        filterUsers(
          users,
          {
            query,
            role,
            branch,
          }
        ),
      [
        users,
        query,
        role,
        branch,
      ]
    );


  const kpis =
    useMemo(
      () => [

        {
          id:
            "total",
          type:
            "team",
          title:
            "Total de usuarios",
          value:
            String(
              users.length
            ),
          description:
            "Usuarios visibles",
        },


        {
          id:
            "managers",
          type:
            "team",
          title:
            "Gerentes de sucursal",
          value:
            String(
              users.filter(
                (user) =>
                  user.role ===
                  ROLES.INDIGO_GERENTE_SUCURSAL
              ).length
            ),
          description:
            "Con sucursal asignada",
        },


        {
          id:
            "staff",
          type:
            "team",
          title:
            "Personal de sucursal",
          value:
            String(
              users.filter(
                (user) =>
                  user.role ===
                    ROLES.INDIGO_EMPLEADO_VENTAS ||
                  user.role ===
                    ROLES.INDIGO_EMPLEADO_LABORATORIO
              ).length
            ),
          description:
            "Ventas y laboratorio",
        },


        {
          id:
            "inactive",
          type:
            "team",
          title:
            "Inactivos",
          value:
            String(
              users.filter(
                (user) =>
                  user.status ===
                  "inactive"
              ).length
            ),
          description:
            "Dados de baja",
        },
      ],
      [
        users,
      ]
    );


  const closeModal =
    () =>
      setModal(
        (current) => ({
          ...current,
          open:
            false,
        })
      );


  const handleSubmit =
    async (payload) => {

      if (
        modal.mode === "edit" &&
        modal.user
      ) {

        await update(
          modal.user.id,
          payload
        );

      } else {

        await create(
          payload
        );
      }
    };


  if (loading) {
    return (
      <LoadingSpinner />
    );
  }


  if (error) {
    return (
      <ErrorState />
    );
  }


  return (

    <PageContainer
      title="Usuarios"
      description="Gestión de los usuarios de Indigo."
      actions={
        <Can
          permission="user.create"
        >
          <Button
            className="
              inline-flex
              items-center
              gap-2
              py-2.5
              text-sm
            "
            onClick={() =>
              setModal({
                open:
                  true,

                mode:
                  "create",

                user:
                  null,
              })
            }
          >

            <Plus
              className="
                h-4
                w-4
              "
            />
            Nuevo usuario
          </Button>
        </Can>
      }
    >

      <div className="space-y-6">
        <KpiRow
          items={
            kpis
          }
        />

        <FilterBar>
          <SearchInput
            className="
              w-full
              sm:max-w-xs
            "
            value={
              query
            }
            onChange={
              setQuery
            }
            placeholder="
              Buscar por nombre o sucursal
            "
          />

          <SelectFilter
            label="Rol"
            value={
              role
            }
            onChange={
              setRole
            }
            placeholder="
              Todos los roles
            "
            options={
              INDIGO_USER_ROLES
            }
          />


          <SelectFilter
            label="Sucursal"
            value={
              branch
            }
            onChange={
              setBranch
            }
            placeholder="
              Todas las sucursales
            "
            options={
              branchOptions
            }
          />

        </FilterBar>


        <UserTable
          users={
            filtered
          }
          canEdit={
            can(
              "user.update"
            )
          }
          canDeactivate={
            can(
              "user.deactivate"
            )
          }
          onEdit={
            (user) =>
              setModal({
                open:
                  true,
                mode:
                  "edit",
                user,
              })
          }

          onDeactivate={
            (user) =>
              setConfirmAction({
                type: "deactivate",
                user,
              })
          }

          onActivate={
            (user) =>
              setConfirmAction({
                type: "activate",
                user,
              })
          }
        />

      </div>


      <UserFormModal
        key={`
          ${modal.mode}-
          ${modal.user?.id ?? "new"}-
          ${modal.open}
        `}
        open={
          modal.open
        }
        mode={
          modal.mode
        }
        user={
          modal.user
        }
        onClose={
          closeModal
        }
        onSubmit={
          handleSubmit
        }
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === "activate"
            ? "Dar de alta usuario"
            : "Dar de baja usuario"
        }
        description={
          confirmAction &&
          (confirmAction.type === "activate"
            ? `¿Seguro que quieres dar de alta a "${confirmAction.user.name}"?`
            : `¿Seguro que quieres dar de baja a "${confirmAction.user.name}"?`)
        }
        confirmLabel={
          confirmAction?.type === "activate"
            ? "Dar de alta"
            : "Dar de baja"
        }
        variant={
          confirmAction?.type === "activate"
            ? "primary"
            : "danger"
        }
        onConfirm={() =>
          confirmAction.type === "activate"
            ? activate(confirmAction.user.id)
            : deactivate(confirmAction.user.id)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>
  );
}
