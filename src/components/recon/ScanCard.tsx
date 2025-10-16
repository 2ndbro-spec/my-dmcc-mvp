import { Badge } from "@/components/ui/badge";

type Props = {
  title: string;
  url: string;
  kpis: { label: string; value: string | number }[];
  notes?: string;
};

export default function ScanCard({ title, url, kpis, notes }: Props) {
  return (
    <div className="rounded-2xl shadow p-4 md:p-6 grid gap-3 bg-white">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
        <Badge variant="secondary" className="truncate max-w-[60%]">{url}</Badge>
      </div>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <li key={k.label} className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="text-base md:text-lg font-medium">{k.value}</div>
          </li>
        ))}
      </ul>
      {notes && <p className="text-sm text-gray-600">{notes}</p>}
    </div>
  );
}