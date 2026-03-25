interface DataSource {
  name: string;
  status: "found" | "not_found" | "partial";
  detail?: string;
}

interface DataSourcesTableProps {
  sources: DataSource[];
}

const statusIndicators: Record<
  DataSource["status"],
  { icon: string; colour: string; label: string }
> = {
  found: { icon: "\u2713", colour: "text-green-600", label: "Found" },
  not_found: { icon: "\u2717", colour: "text-zinc-400", label: "Not found" },
  partial: { icon: "\u2013", colour: "text-amber-600", label: "Partial" },
};

export function DataSourcesTable({ sources }: DataSourcesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="pb-2 pr-4 font-semibold text-xs tracking-wide uppercase text-zinc-400">
              Source
            </th>
            <th className="pb-2 pr-4 font-semibold text-xs tracking-wide uppercase text-zinc-400">
              Status
            </th>
            <th className="pb-2 font-semibold text-xs tracking-wide uppercase text-zinc-400">
              Detail
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => {
            const indicator = statusIndicators[source.status];
            return (
              <tr
                key={source.name}
                className="border-b border-zinc-100 last:border-b-0"
              >
                <td className="py-2.5 pr-4 font-medium text-zinc-700">
                  {source.name}
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`font-mono font-bold ${indicator.colour}`}>
                    {indicator.icon}
                  </span>
                  <span className="ml-2 text-zinc-500">{indicator.label}</span>
                </td>
                <td className="py-2.5 text-zinc-500">
                  {source.detail || "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
