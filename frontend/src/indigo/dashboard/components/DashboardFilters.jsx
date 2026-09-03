import FilterBar from "../../../shared/filters/FilterBar";

import SelectFilter from "../../../shared/filters/SelectFilter";


export default function DashboardFilters({
    branches = [],
    selectedBranch,
    selectedPeriod,
    onBranchChange,
    onPeriodChange,
}) {

    const periods = [
        {
            value: "day",
            label: "Hoy"
        },
        {
            value: "week",
            label: "Semana"
        },
        {
            value: "month",
            label: "Mes"
        },
        {
            value: "year",
            label: "Año"
        }
    ];


    return (
        <FilterBar>

            <SelectFilter
                label="Sucursal"
                value={selectedBranch}
                onChange={onBranchChange}
                placeholder="Todas las sucursales"
                options={branches.map((branch) => ({
                    value: branch.id,
                    label: branch.name
                }))}
            />


            <SelectFilter
                label="Periodo"
                value={selectedPeriod}
                onChange={onPeriodChange}
                options={periods}
            />

        </FilterBar>
    );
}