import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Dashboard() {
  // 1. Simulation Parameter States
  const [beta, setBeta] = useState<number>(0.30);
  const [gamma, setGamma] = useState<number>(0.10);
  const [population, setPopulation] = useState<number>(10000);
  const [initialInfected, setInitialInfected] = useState<number>(10);
  const [duration, setDuration] = useState<number>(160);

  // 2. High-Precision RK4 Mathematical Engine
  const simulationData = useMemo(() => {
    let S = population - initialInfected;
    let I = initialInfected;
    let R = 0;

    const t_data: number[] = [0];
    const s_data: number[] = [Math.round(S)];
    const i_data: number[] = [Math.round(I)];
    const r_data: number[] = [Math.round(R)];

    let peakInfected = initialInfected;
    let peakDay = 0;

    const dt = 0.1; // Sub-stepping for ultra-smooth curves
    const stepsPerDay = 1 / dt;

    for (let day = 1; day <= duration; day++) {
      for (let step = 0; step < stepsPerDay; step++) {
        const fS = (s: number, i: number) => -(beta * s * i) / population;
        const fI = (s: number, i: number) => ((beta * s * i) / population) - (gamma * i);

        // RK4 Coefficients
        const k1_s = fS(S, I);
        const k1_i = fI(S, I);

        const k2_s = fS(S + 0.5 * dt * k1_s, I + 0.5 * dt * k1_i);
        const k2_i = fI(S + 0.5 * dt * k1_s, I + 0.5 * dt * k1_i);

        const k3_s = fS(S + 0.5 * dt * k2_s, I + 0.5 * dt * k2_i);
        const k3_i = fI(S + 0.5 * dt * k2_s, I + 0.5 * dt * k2_i);

        const k4_s = fS(S + dt * k3_s, I + dt * k3_i);
        const k4_i = fI(S + dt * k3_s, I + dt * k3_i);

        S += (dt / 6) * (k1_s + 2 * k2_s + 2 * k3_s + k4_s);
        I += (dt / 6) * (k1_i + 2 * k2_i + 2 * k3_i + k4_i);
        R += (dt / 6) * (gamma * I); 
      }

      // Safeguards
      S = Math.max(0, S);
      I = Math.max(0, I);
      R = Math.min(population, R);

      if (I > peakInfected) {
        peakInfected = I;
        peakDay = day;
      }

      t_data.push(day);
      s_data.push(Math.round(S));
      i_data.push(Math.round(I));
      r_data.push(Math.round(R));
    }

    const r0 = beta / gamma;
    const totalRecovered = r_data[r_data.length - 1];
    const attackRate = ((population - s_data[s_data.length - 1]) / population) * 100;

    return { t_data, s_data, i_data, r_data, r0, peakInfected, peakDay, totalRecovered, attackRate };
  }, [beta, gamma, population, initialInfected, duration]);

  // 3. Chart.js Config Setup
  const chartData = {
    labels: simulationData.t_data,
    datasets: [
      {
        label: "Susceptible (S)",
        data: simulationData.s_data,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.04)",
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.35
      },
      {
        label: "Infected (I)",
        data: simulationData.i_data,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.04)",
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.35
      },
      {
        label: "Recovered (R)",
        data: simulationData.r_data,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.04)",
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.35
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { weight: "600", size: 12 } }
      },
      tooltip: {
        padding: 12,
        borderRadius: 8,
        callbacks: {
          title: (context: any) => `Day ${context[0].label}`,
          label: (context: any) => ` ${context.dataset.label.split(" ")[0]}: ${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Days", font: { weight: "bold" } },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: "Population Count", font: { weight: "bold" } },
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.04)" }
      }
    }
  };

  const [activeTab, setActiveTab] = useState("visualizer");

  return (
    <main className="min-h-screen bg-white text-slate-800 py-8 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header - Reduced Size */}
        <header className="flex flex-col items-center text-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            Explore epidemic models and visualizations
          </p>
        </header>

        {/* Dashboard Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setActiveTab("visualizer")}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors duration-200 ${
              activeTab === "visualizer"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            SIR Visualizer
          </button>
          <button
            onClick={() => setActiveTab("graphs")}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors duration-200 ${
              activeTab === "graphs"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            SIR Graphs
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors duration-200 ${
              activeTab === "results"
                ? "bg-green-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Results Dashboards
          </button>
        </div>

        {/* SIR Visualizer Tab */}
        {activeTab === "visualizer" && (
          <>
            {/* Dynamic Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reproduction # (R₀)</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{simulationData.r0.toFixed(2)}</div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Infected</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">{Math.round(simulationData.peakInfected).toLocaleString()}</div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Occurrence</div>
                <div className="text-2xl font-bold text-amber-500 mt-1">Day {simulationData.peakDay}</div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recovered</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{simulationData.totalRecovered.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center col-span-2 md:col-span-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attack Rate</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">{simulationData.attackRate.toFixed(1)}%</div>
              </div>
            </div>

            {/* Dashboard Control & Graph Splits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Sliders Container Box */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-2 border-slate-100">Parameters</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <label>Transmission Rate (β)</label>
                    <span className="text-indigo-500">{beta.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.01" max="1.0" step="0.01" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <label>Recovery Rate (γ)</label>
                    <span className="text-emerald-500">{gamma.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.01" max="1.0" step="0.01" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <label>Total Population (N)</label>
                    <span className="text-slate-900">{population.toLocaleString()}</span>
                  </div>
                  <input type="range" min="100" max="100000" step="100" value={population} onChange={(e) => setPopulation(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <label>Initial Infected (I₀)</label>
                    <span className="text-rose-500">{initialInfected}</span>
                  </div>
                  <input type="range" min="1" max={Math.min(population, 2000)} step="1" value={initialInfected} onChange={(e) => setInitialInfected(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <label>Simulation Duration (Days)</label>
                    <span className="text-amber-500">{duration}</span>
                  </div>
                  <input type="range" min="10" max="365" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                </div>
              </div>

              {/* Interactive Graph Display Canvas */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="relative w-full h-[380px]">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

            </div>
          </>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== "visualizer" && (
          <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
            <div className="text-center py-12">
              <p className="text-slate-500">
                {activeTab === "graphs" ? "SIR Graphs" : "Results Dashboards"} coming soon!
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
