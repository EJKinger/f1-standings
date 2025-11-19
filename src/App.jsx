import { useState } from 'react'
import { useSeasonStandings } from './hooks/useF1Data'
import StandingsChart from './components/StandingsChart'

function App() {
  const [year, setYear] = useState(2025)
  const [type, setType] = useState('driver') // 'driver' or 'constructor'
  const [scale, setScale] = useState('rank') // 'rank' or 'points'
  const { data, isLoading, error } = useSeasonStandings(year, type)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            F1 Standings Visualizer
          </h1>
          <p className="text-slate-400 mt-2">Visualize championship battles week by week</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Scale Toggle */}
          <div className="bg-slate-800 p-1 rounded-lg flex">
            <button
              onClick={() => setScale('rank')}
              className={`px-4 py-2 rounded-md transition-all ${
                scale === 'rank' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rank
            </button>
            <button
              onClick={() => setScale('points')}
              className={`px-4 py-2 rounded-md transition-all ${
                scale === 'points' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Points
            </button>
          </div>

          {/* Type Toggle */}
          <div className="bg-slate-800 p-1 rounded-lg flex">
            <button
              onClick={() => setType('driver')}
              className={`px-4 py-2 rounded-md transition-all ${
                type === 'driver' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Drivers
            </button>
            <button
              onClick={() => setType('constructor')}
              className={`px-4 py-2 rounded-md transition-all ${
                type === 'constructor' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Constructors
            </button>
          </div>

          {/* Year Select */}
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="bg-slate-800 text-white p-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {[2025, 2024, 2023, 2022, 2021].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg mb-6">
          {isLoading && <p className="text-center">Loading data...</p>}
          {error && <p className="text-center text-red-500">Error loading data</p>}
          
          {!isLoading && !error && data && (
            <StandingsChart data={data.series} races={data.races} scale={scale} />
          )}
        </div>
        
        <footer className="text-center text-slate-500 text-sm mt-8">
          <p>Data provided by <a href="http://ergast.com/mrd/" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">Ergast Developer API</a></p>
        </footer>
      </main>
    </div>
  )
}

export default App
