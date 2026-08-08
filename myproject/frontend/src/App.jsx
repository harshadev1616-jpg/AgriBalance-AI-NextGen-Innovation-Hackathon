import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CloudRain,
  Download,
  Factory,
  Gauge,
  Globe2,
  Landmark,
  Leaf,
  LineChart,
  Loader2,
  MapPinned,
  Satellite,
  Send,
  TrendingUp,
  Wallet,
  Waves,
} from "lucide-react";
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
import KarnatakaMap from "./components/KarnatakaMap.jsx";
import { api } from "./services/api.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const districts = ["Mandya", "Mysuru", "Belagavi", "Tumakuru", "Raichur", "Dharwad", "Bengaluru Urban"];
const crops = ["Rice", "Ragi", "Jowar", "Maize", "Tur Dal", "Groundnut", "Cotton", "Sugarcane", "Tomato", "Millets"];
const cropDefaults = {
  Rice: { yieldPerHectare: 48, sellingPrice: 2400, costs: { seed: 9000, fertilizer: 17000, labor: 24000, irrigation: 8000, other: 4000 } },
  Ragi: { yieldPerHectare: 21, sellingPrice: 4300, costs: { seed: 5000, fertilizer: 9000, labor: 14000, irrigation: 2500, other: 2500 } },
  Jowar: { yieldPerHectare: 19, sellingPrice: 3900, costs: { seed: 5000, fertilizer: 8000, labor: 13000, irrigation: 2000, other: 2000 } },
  Maize: { yieldPerHectare: 46, sellingPrice: 2250, costs: { seed: 8000, fertilizer: 14000, labor: 18000, irrigation: 4000, other: 3000 } },
  "Tur Dal": { yieldPerHectare: 12, sellingPrice: 7200, costs: { seed: 6000, fertilizer: 9000, labor: 16000, irrigation: 2500, other: 2500 } },
  Groundnut: { yieldPerHectare: 18, sellingPrice: 6100, costs: { seed: 10000, fertilizer: 11000, labor: 18000, irrigation: 3000, other: 2000 } },
  Cotton: { yieldPerHectare: 16, sellingPrice: 6900, costs: { seed: 12000, fertilizer: 17000, labor: 24000, irrigation: 3000, other: 3000 } },
  Sugarcane: { yieldPerHectare: 820, sellingPrice: 340, costs: { seed: 22000, fertilizer: 29000, labor: 43000, irrigation: 14000, other: 7000 } },
  Tomato: { yieldPerHectare: 260, sellingPrice: 1150, costs: { seed: 12000, fertilizer: 18000, labor: 26000, irrigation: 10000, other: 6000 } },
  Millets: { yieldPerHectare: 18, sellingPrice: 5600, costs: { seed: 5000, fertilizer: 8000, labor: 14000, irrigation: 1500, other: 2500 } },
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#cbd5e1", boxWidth: 10 } },
    tooltip: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148, 163, 184, 0.08)" }, beginAtZero: true },
  },
};

function currency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateProfit({ district, crop, farmSize, soil, water, yieldPerHectare, sellingPrice, costs, backendProfit }) {
  const area = numberValue(farmSize);
  const yieldPerArea = numberValue(yieldPerHectare);
  const price = numberValue(sellingPrice);
  const normalizedCosts = {
    seed_cost: numberValue(costs.seed),
    fertilizer_cost: numberValue(costs.fertilizer),
    labor_cost: numberValue(costs.labor),
    irrigation_cost: numberValue(costs.irrigation),
    other_cost: numberValue(costs.other),
  };
  const totalYield = yieldPerArea * area;
  const expenses = Object.values(normalizedCosts).reduce((total, value) => total + value, 0);
  const revenue = totalYield * price;
  const netProfit = revenue - expenses;

  return {
    district,
    recommended_crop: crop,
    farm_size: area,
    soil,
    water: numberValue(water),
    yield_per_hectare: yieldPerArea,
    total_yield: totalYield,
    selling_price: price,
    costs: normalizedCosts,
    revenue: Math.round(revenue),
    expenses: Math.round(expenses),
    net_profit: Math.round(netProfit),
    roi: expenses ? Number(((netProfit / expenses) * 100).toFixed(2)) : 0,
    risk: backendProfit?.risk ?? "--",
  };
}

function Panel({ children, className = "" }) {
  return <section className={`rounded-lg border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur ${className}`}>{children}</section>;
}

function Stat({ title, value, icon: Icon, tone = "text-emerald-300" }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value ?? "--"}</p>
        </div>
        <div className={`rounded-md border border-white/10 bg-white/10 p-2 ${tone}`}>
          <Icon size={21} />
        </div>
      </div>
    </Panel>
  );
}

function ScoreBar({ label, value, tone = "bg-emerald-400" }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{value ?? 0}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-10 animate-pulse rounded-md bg-white/10" />;
}

export default function App() {
  const [district, setDistrict] = useState("Mandya");
  const [crop, setCrop] = useState("Tomato");
  const [farmSize, setFarmSize] = useState(2);
  const [budget, setBudget] = useState(180000);
  const [water, setWater] = useState(62);
  const [yieldPerHectare, setYieldPerHectare] = useState(cropDefaults.Tomato.yieldPerHectare);
  const [sellingPrice, setSellingPrice] = useState(cropDefaults.Tomato.sellingPrice);
  const [costs, setCosts] = useState(cropDefaults.Tomato.costs);
  const [question, setQuestion] = useState("Is tomato risky?");
  const [selected, setSelected] = useState({ lat: 12.9716, lon: 77.5946 });
  const [state, setState] = useState({
    balancing: null,
    heatmap: null,
    comparison: null,
    market: null,
    assistant: null,
    notifications: null,
    profit: null,
    satellite: null,
    admin: null,
    government: null,
  });
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const defaults = cropDefaults[crop];
    setYieldPerHectare(defaults.yieldPerHectare);
    setSellingPrice(defaults.sellingPrice);
    setCosts(defaults.costs);
  }, [crop]);

  useEffect(() => {
    let active = true;
    async function loadPhaseTwo() {
      setLoading(true);
      setError("");
      try {
        const [balancing, heatmap, comparison, market, notifications, satellite, admin, government] = await Promise.all([
          api.cropBalancing({ district, water_availability: water }),
          api.districtHeatmap(),
          api.compareDistricts(["Mandya", "Mysuru", "Belagavi", "Tumakuru"]),
          api.marketIntelligence(district, crop),
          api.smartNotifications(district),
          api.satelliteAnalytics(district),
          api.adminAnalytics(),
          api.governmentDashboard(),
        ]);
        if (active) {
          setState((current) => ({ ...current, balancing, heatmap, comparison, market, notifications, satellite, admin, government }));
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPhaseTwo();
    return () => {
      active = false;
    };
  }, [district, crop, water]);

  useEffect(() => {
    let active = true;
    async function loadProfit() {
      try {
        const profit = await api.profitCalculator({
          district,
          crop,
          farm_size: numberValue(farmSize),
          budget: numberValue(budget),
          soil: "Loamy",
          water: numberValue(water),
          yield_per_hectare: numberValue(yieldPerHectare),
          selling_price: numberValue(sellingPrice),
          seed_cost: numberValue(costs.seed),
          fertilizer_cost: numberValue(costs.fertilizer),
          labor_cost: numberValue(costs.labor),
          irrigation_cost: numberValue(costs.irrigation),
          other_cost: numberValue(costs.other),
        });
        if (active) {
          setState((current) => ({ ...current, profit }));
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    }
    loadProfit();
    return () => {
      active = false;
    };
  }, [district, crop, farmSize, budget, water, yieldPerHectare, sellingPrice, costs]);

  async function askAssistant(event) {
    event.preventDefault();
    setAsking(true);
    try {
      const assistant = await api.askFarmerAssistant({ question, district, farm_size: farmSize });
      setState((current) => ({ ...current, assistant }));
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  }

  function updateCost(name, value) {
    setCosts((current) => ({ ...current, [name]: numberValue(value) }));
  }

  const topCrops = state.balancing?.top_recommended_crops || [];
  const heatmap = state.heatmap?.districts || [];
  const comparison = state.comparison?.districts || [];
  const bestCrop = topCrops[0];
  const liveProfit = useMemo(
    () =>
      calculateProfit({
        district,
        crop,
        farmSize,
        soil: "Loamy",
        water,
        yieldPerHectare,
        sellingPrice,
        costs,
        backendProfit: state.profit,
      }),
    [district, crop, farmSize, water, yieldPerHectare, sellingPrice, costs, state.profit],
  );
  const calculatedProfit = liveProfit.net_profit;
  const comparisonWithCalculatorProfit = comparison.map((item) =>
    item.district === district && calculatedProfit !== undefined ? { ...item, profit: calculatedProfit } : item,
  );

  const marketChart = useMemo(
    () => ({
      labels: state.market?.price_forecast?.map((item) => item.month) || [],
      datasets: [
        {
          label: "Forecast price",
          data: state.market?.price_forecast?.map((item) => item.price) || [],
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.18)",
          tension: 0.35,
        },
      ],
    }),
    [state.market],
  );

  const comparisonChart = useMemo(
    () => ({
      labels: comparisonWithCalculatorProfit.map((item) => item.district),
      datasets: [
        { label: "Profit", data: comparisonWithCalculatorProfit.map((item) => item.profit), backgroundColor: "#34d399" },
        { label: "Demand", data: comparisonWithCalculatorProfit.map((item) => item.demand * 1000), backgroundColor: "#f59e0b" },
        { label: "Supply risk", data: comparisonWithCalculatorProfit.map((item) => item.supply * 1000), backgroundColor: "#fb7185" },
      ],
    }),
    [comparisonWithCalculatorProfit],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">AgriBalance AI Phase 2</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Crop Planning Command Center</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <select className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={district} onChange={(event) => setDistrict(event.target.value)}>
              {districts.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={crop} onChange={(event) => setCrop(event.target.value)}>
              {crops.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        {loading ? <Skeleton /> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Best crop" value={bestCrop?.crop} icon={Leaf} />
          <Stat title="Expected profit" value={calculatedProfit !== undefined ? currency(calculatedProfit) : bestCrop ? currency(bestCrop.expected_profit) : "--"} icon={Wallet} tone="text-amber-300" />
          <Stat title="Profit score" value={bestCrop ? `${bestCrop.profit_score}/100` : "--"} icon={Gauge} tone="text-sky-300" />
          <Stat title="Oversupply risk" value={bestCrop ? `${bestCrop.oversupply_risk}%` : "--"} icon={AlertTriangle} tone="text-rose-300" />
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">AI crop balancing engine</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{district} recommendation portfolio</h2>
              </div>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                {state.balancing?.model || "phase2"}
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {topCrops.map((item) => (
                <article key={item.crop} className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.crop}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.reasoning}</p>
                    </div>
                    <span className="rounded-md bg-white/10 px-3 py-1 text-sm text-slate-100">{item.recommendation}</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <ScoreBar label="Profit" value={item.profit_score} />
                    <ScoreBar label="Demand" value={item.demand_score} tone="bg-sky-400" />
                    <ScoreBar label="Water fit" value={item.water_usage_score} tone="bg-cyan-400" />
                    <ScoreBar label="Climate safety" value={100 - item.climate_risk} tone="bg-amber-300" />
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <MapPinned className="text-emerald-300" size={22} />
              <h2 className="text-xl font-semibold text-white">District Heatmap</h2>
            </div>
            <div className="mt-4 grid max-h-[560px] gap-2 overflow-auto pr-1">
              {heatmap.map((item) => (
                <button
                  key={item.district}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-slate-900/70 p-3 text-left transition hover:border-emerald-300/50"
                  onClick={() => setDistrict(item.district)}
                  type="button"
                >
                  <span>
                    <span className="block font-medium text-white">{item.district}</span>
                    <span className="mt-1 block text-xs text-slate-400">{item.best_crop} | rain {item.rainfall} mm | water {item.water_availability}/100</span>
                  </span>
                  <span className={`h-3 w-3 rounded-full ${item.status === "green" ? "bg-emerald-400" : item.status === "yellow" ? "bg-amber-300" : "bg-rose-400"}`} />
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <KarnatakaMap selected={selected} onSelect={setSelected} />
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <LineChart className="text-sky-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Smart District Comparison</h2>
            </div>
            <div className="mt-5 h-80">
              <Bar data={comparisonChart} options={chartOptions} />
            </div>
          </Panel>
        </div>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5 lg:col-span-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-cyan-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Market Intelligence</h2>
            </div>
            <div className="mt-5 h-72">
              <Line data={marketChart} options={chartOptions} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat title="Demand" value={`${state.market?.demand ?? "--"}/100`} icon={BarChart3} tone="text-emerald-300" />
              <Stat title="Saturation" value={`${state.market?.market_saturation ?? "--"}%`} icon={Factory} tone="text-rose-300" />
              <Stat title="Sell window" value={state.market?.best_selling_window} icon={Download} tone="text-amber-300" />
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Bot className="text-emerald-300" size={22} />
              <h2 className="text-xl font-semibold text-white">AI Farmer Assistant</h2>
            </div>
            <form className="mt-4 flex gap-2" onSubmit={askAssistant}>
              <input className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={question} onChange={(event) => setQuestion(event.target.value)} />
              <button className="rounded-md bg-emerald-400 px-3 py-2 text-slate-950" type="submit" title="Ask assistant">
                {asking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
            <p className="mt-4 rounded-lg border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-200">
              {state.assistant?.answer || "Ask a crop planning question to get a data-backed response."}
            </p>
            <div className="mt-4 grid gap-2">
              {state.notifications?.alerts?.map((alert) => (
                <div key={alert.title} className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                  <strong>{alert.title}:</strong> {alert.action}
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Wallet className="text-amber-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Profit Calculator</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm text-slate-300">Farm size: {farmSize} ha</label>
              <input type="range" min="0.5" max="10" step="0.5" value={farmSize} onChange={(event) => setFarmSize(Number(event.target.value))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Yield / ha
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" step="0.01" value={yieldPerHectare} onChange={(event) => setYieldPerHectare(numberValue(event.target.value))} />
                </label>
                <label className="text-sm text-slate-300">
                  Selling price
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" step="0.01" value={sellingPrice} onChange={(event) => setSellingPrice(numberValue(event.target.value))} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Seed cost
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" value={costs.seed} onChange={(event) => updateCost("seed", event.target.value)} />
                </label>
                <label className="text-sm text-slate-300">
                  Fertilizer cost
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" value={costs.fertilizer} onChange={(event) => updateCost("fertilizer", event.target.value)} />
                </label>
                <label className="text-sm text-slate-300">
                  Labor cost
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" value={costs.labor} onChange={(event) => updateCost("labor", event.target.value)} />
                </label>
                <label className="text-sm text-slate-300">
                  Irrigation cost
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" value={costs.irrigation} onChange={(event) => updateCost("irrigation", event.target.value)} />
                </label>
                <label className="text-sm text-slate-300 sm:col-span-2">
                  Other cost
                  <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" type="number" min="0" value={costs.other} onChange={(event) => updateCost("other", event.target.value)} />
                </label>
              </div>
              <label className="text-sm text-slate-300">Budget: {currency(budget)}</label>
              <input type="range" min="50000" max="800000" step="10000" value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
              <label className="text-sm text-slate-300">Water: {water}/100</label>
              <input type="range" min="10" max="100" value={water} onChange={(event) => setWater(Number(event.target.value))} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-white/10 p-3">Revenue<br /><strong>{currency(liveProfit.revenue)}</strong></div>
              <div className="rounded-md bg-white/10 p-3">Net profit<br /><strong>{currency(liveProfit.net_profit)}</strong></div>
              <div className="rounded-md bg-white/10 p-3">ROI<br /><strong>{liveProfit.roi}%</strong></div>
              <div className="rounded-md bg-white/10 p-3">Risk<br /><strong>{liveProfit.risk}</strong></div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Satellite className="text-sky-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Satellite Analytics</h2>
            </div>
            <div className="mt-5 grid gap-4">
              <ScoreBar label="Vegetation index" value={Math.round((state.satellite?.vegetation_index || 0) * 100)} tone="bg-emerald-400" />
              <ScoreBar label="Crop health" value={state.satellite?.crop_health} tone="bg-cyan-400" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-white/10 p-3">Drought<br /><strong>{state.satellite?.drought_detection ? "Detected" : "Clear"}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Flood<br /><strong>{state.satellite?.flood_detection ? "Detected" : "Clear"}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Stage<br /><strong>{state.satellite?.growth_stage}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Land<br /><strong>{state.satellite?.land_classification}</strong></div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Landmark className="text-rose-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Government Dashboard</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <Stat title="Crop diversity" value={`${state.government?.crop_diversity ?? "--"}/100`} icon={Globe2} tone="text-emerald-300" />
              <Stat title="Food security" value={`${state.government?.food_security ?? "--"}/100`} icon={Leaf} tone="text-sky-300" />
              <Stat title="Water usage risk" value={`${state.government?.water_usage ?? "--"}/100`} icon={Waves} tone="text-cyan-300" />
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
