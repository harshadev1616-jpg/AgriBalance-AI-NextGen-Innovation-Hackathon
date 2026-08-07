import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" },
  },
  scales: {
    y: { beginAtZero: true },
  },
};

export default function ChartsPanel({ forecast, market }) {
  const forecastItems = forecast?.items?.slice(0, 10) || [];
  const marketRecords = market?.records?.slice(0, 8) || [];

  const rainfallData = {
    labels: forecastItems.map((item) => item.timestamp?.slice(5, 16) || ""),
    datasets: [
      {
        label: "Rainfall mm",
        data: forecastItems.map((item) => item.rainfall || 0),
        borderColor: "#277da1",
        backgroundColor: "rgba(39, 125, 161, 0.18)",
        tension: 0.35,
      },
    ],
  };

  const marketData = {
    labels: marketRecords.map((item) => item.market || item.district || "Market"),
    datasets: [
      {
        label: "Modal price",
        data: marketRecords.map((item) => Number(item.modal_price || 0)),
        backgroundColor: "#f2b544",
        borderColor: "#8f5f35",
      },
    ],
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">Rainfall Forecast</h2>
        <div className="mt-4 h-72">
          <Line data={rainfallData} options={chartOptions} />
        </div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">Market Analysis</h2>
        <div className="mt-4 h-72">
          <Bar data={marketData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
}
