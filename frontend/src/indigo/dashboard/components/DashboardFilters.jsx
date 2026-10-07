import FilterBar from "../../../shared/filters/FilterBar";

import SelectFilter from "../../../shared/filters/SelectFilter";


export default function DashboardFilters({
    branches = [],
    selectedBranch,
    selectedPeriod,
    onBranchChange,
    onPeriodChange,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
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

            {onDateFromChange && (
                <div className="flex items-end gap-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">Desde</label>
                        <input
                            type="date"
                            value={dateFrom ?? ""}
                            onChange={(e) => onDateFromChange(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">Hasta</label>
                        <input
                            type="date"
                            value={dateTo ?? ""}
                            onChange={(e) => onDateToChange(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
                        />
                    </div>
                </div>
            )}

        </FilterBar>
    );
}