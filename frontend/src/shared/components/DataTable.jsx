import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";


function Pagination({ page, totalPages, total, pageSize, onChange }) {

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-surface px-5 py-3">

      <p className="text-sm text-text-secondary">
        Mostrando {from} - {to} de {total} resultados
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-text-secondary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
              n === page
                ? "bg-indigo-primary text-white"
                : "text-text-secondary hover:bg-background"
            }`}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-text-secondary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}


export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = "No existen registros.",
  headerBorderColor,
  pageSize,
  rowClassName,
}) {

  const [page, setPage] = useState(1);
  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setPage(1);
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-surface p-6 text-center text-sm text-text-secondary">
        {emptyMessage}
      </div>
    );
  }

  const totalPages = pageSize ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pageData = pageSize ? data.slice((safePage - 1) * pageSize, safePage * pageSize) : data;

  return (

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-surface">

      <div className="overflow-x-auto">

        <table className={`min-w-full ${headerBorderColor ? "" : "divide-y divide-gray-200"}`}>

          <thead
            className="bg-background"
            style={headerBorderColor ? { borderBottom: `2px solid ${headerBorderColor}` } : undefined}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {pageData.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={`transition hover:bg-background ${rowClassName ? rowClassName(row) : ""}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 text-sm text-text-primary">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {pageSize && totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={data.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      )}

      {pageSize && totalPages === 1 && data.length > 0 && (
        <div className="border-t border-gray-200 bg-surface px-5 py-3">
          <p className="text-sm text-text-secondary">Mostrando {data.length} de {data.length} resultados</p>
        </div>
      )}

    </div>

  );
}
