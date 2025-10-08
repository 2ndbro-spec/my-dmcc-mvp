import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

export default function KpiGauge({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const data = [{ name: label, value: v }];
  return (
    <div className="rounded-2xl shadow p-4 grid place-items-center bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="w-full h-40 md:h-56">
        <ResponsiveContainer>
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="95%" data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false}/>
            <RadialBar dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-2xl font-semibold">{v}%</div>
    </div>
  );
}