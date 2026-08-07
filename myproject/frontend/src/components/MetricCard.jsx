export default function MetricCard({ title, value, unit, icon: Icon, tone = "field" }) {
  const tones = {
    field: "border-field/25 bg-field/10 text-field",
    harvest: "border-harvest/30 bg-harvest/15 text-soil",
    water: "border-water/25 bg-water/10 text-water",
    soil: "border-soil/25 bg-soil/10 text-soil",
  };

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {value ?? "--"}
            {unit ? <span className="ml-1 text-sm font-medium text-stone-500">{unit}</span> : null}
          </p>
        </div>
        {Icon ? (
          <div className={`rounded-lg border p-2 ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
