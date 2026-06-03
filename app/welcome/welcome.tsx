import { useState, useMemo } from "react";
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";
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

export function Welcome({ message }: { message: string }) {
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
        tension: 0.35 // Creates the smooth bezier curve interpolation
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
      intersect: false // Allows hover calculations anywhere across the vertical slice
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { weight: "bold" as const, size: 12 } }
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
        title: { display: true, text: "Days", font: { weight: "bold" as const } },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: "Population Count", font: { weight: "bold" as const } },
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.04)" }
      }
    }
  } as any;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with App Logos */}
        <header className="flex flex-col items-center text-center gap-3">
          <img src={logoLight} alt="Logo" className="h-10 w-auto block dark:hidden" />
          <img src={logoDark} alt="Logo" className="h-10 w-auto hidden dark:block" />
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-white">
            SIR Epidemic Model Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{message}</p>
        </header>

        {/* Dynamic Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reproduction # (R₀)</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{simulationData.r0.toFixed(2)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Infected</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{Math.round(simulationData.peakInfected).toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Occurrence</div>
            <div className="text-2xl font-bold text-amber-500 dark:text-amber-400 mt-1">Day {simulationData.peakDay}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recovered</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{simulationData.totalRecovered.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 text-center col-span-2 md:col-span-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attack Rate</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{simulationData.attackRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Dashboard Control & Graph Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Sliders Container Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">Parameters</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <label>Transmission Rate (β)</label>
                <span className="text-indigo-500">{beta.toFixed(2)}</span>
              </div>
              <input type="range" min="0.01" max="1.0" step="0.01" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <label>Recovery Rate (γ)</label>
                <span className="text-emerald-500">{gamma.toFixed(2)}</span>
              </div>
              <input type="range" min="0.01" max="1.0" step="0.01" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <label>Total Population (N)</label>
                <span className="text-slate-900 dark:text-slate-100">{population.toLocaleString()}</span>
              </div>
              <input type="range" min="100" max="100000" step="100" value={population} onChange={(e) => setPopulation(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-700 dark:accent-slate-400" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <label>Initial Infected (I₀)</label>
                <span className="text-rose-500">{initialInfected}</span>
              </div>
              <input type="range" min="1" max={Math.min(population, 2000)} step="1" value={initialInfected} onChange={(e) => setInitialInfected(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <label>Simulation Duration (Days)</label>
                <span className="text-amber-500">{duration}</span>
              </div>
              <input type="range" min="10" max="365" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            </div>
          </div>

          {/* Interactive Graph Display Canvas */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200/60 dark:border-slate-800/80">
            <div className="relative w-full h-[380px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

        </div>

        {/* Footer Resource Map Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
          {resources.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 p-2 text-slate-600 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400">
                {item.icon}
              </div>
              <span className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {item.text}
              </span>
            </a>
          ))}
        </div>

      </div>
    </main>
  );
}

const resources = [
  {
    href: "https://reactrouter.com/docs",
    text: "React Router Docs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 20 20" fill="none" className="stroke-current">
        <path d="M9.99981 10.0751V9.99992M17.4688 17.4688C15.889 19.0485 11.2645 16.9853 7.13958 12.8604C3.01467 8.73546 0.951405 4.11091 2.53116 2.53116C4.11091 0.951405 8.73546 3.01467 12.8604 7.13958C16.9853 11.2645 19.0485 15.889 17.4688 17.4688ZM2.53132 17.4688C0.951566 15.8891 3.01483 11.2645 7.13974 7.13963C11.2647 3.01471 15.8892 0.951453 17.469 2.53121C19.0487 4.11096 16.9854 8.73551 12.8605 12.8604C8.73562 16.9853 4.11107 19.0486 2.53132 17.4688Z" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 20" fill="none" className="stroke-current">
        <path d="M15.0686 1.25995L14.5477 1.17423L14.2913 1.63578C14.1754 1.84439 14.0545 2.08275 13.9422 2.31963C12.6461 2.16488 11.3406 2.16505 10.0445 2.32014C9.92822 2.08178 9.80478 1.84975 9.67412 1.62413L9.41449 1.17584L8.90333 1.25995C7.33547 1.51794 5.80717 1.99419 4.37748 2.66939L4.19 2.75793L4.07461 2.93019C1.23864 7.16437 0.46302 11.3053 0.838165 15.3924L0.868838 15.7266L1.13844 15.9264C2.81818 17.1714 4.68053 18.1233 6.68582 18.719L7.18892 18.8684L7.50166 18.4469C7.96179 17.8268 8.36504 17.1824 8.709 16.4944L8.71099 16.4904C10.8645 17.0471 13.128 17.0485 15.2821 16.4947C15.6261 17.1826 16.0293 17.8269 16.4892 18.4469L16.805 18.8725L17.3116 18.717C19.3056 18.105 21.1876 17.1751 22.8559 15.9238L23.1224 15.724L23.1528 15.3923C23.5873 10.6524 22.3579 6.53306 19.8947 2.90714L19.7759 2.73227L19.5833 2.64518C18.1437 1.99439 16.6386 1.51826 15.0686 1.25995ZM16.6074 10.7755L16.6074 10.7756C16.5934 11.6409 16.0212 12.1444 15.4783 12.1444C14.9297 12.1444 14.3493 11.6173 14.3493 10.7877C14.3493 9.94885 14.9378 9.41192 15.4783 9.41192C16.0471 9.41192 16.6209 9.93851 16.6074 10.7755ZM8.49373 12.1444C7.94513 12.1444 7.36471 11.6173 7.36471 10.7877C7.36471 9.94885 7.95323 9.41192 8.49373 9.41192C9.06038 9.41192 9.63892 9.93712 9.6417 10.7815C9.62517 11.6239 9.05462 12.1444 8.49373 12.1444Z" strokeWidth="1.5" />
      </svg>
    )
  }
];