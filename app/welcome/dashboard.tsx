export function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Select a dashboard section to explore
          </p>
        </header>

        {/* Dashboard Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            onClick={() => alert("SIR Visualizer coming soon!")}
          >
            SIR Visualizer
          </button>
          <button
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            onClick={() => alert("SIR Graphs coming soon!")}
          >
            SIR Graphs
          </button>
          <button
            className="px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            onClick={() => alert("Results Dashboards coming soon!")}
          >
            Results Dashboards
          </button>
        </div>

        {/* Placeholder Content Area */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80">
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              Click on a button above to navigate to the selected dashboard section.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
