import { useState } from 'react'
import { useSeasonStandings } from './hooks/useF1Data'
import StandingsChart from './components/StandingsChart'

function App() {
  const [year, setYear] = useState(2025)
  const [type, setType] = useState('driver') // 'driver' or 'constructor'
  const [scale, setScale] = useState('rank');
  const [useLogScale, setUseLogScale] = useState(false);
  
  const { data, isLoading, error } = useSeasonStandings(year, type);

  // Define years array for the new year selection UI
  const years = [2025, 2024, 2023, 2022, 2021];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              F1 Standings Visualizer
            </h1>
            <p className="text-slate-400 mt-2">Interactive season progress charts</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Year Toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    year === y 
                      ? 'bg-red-600 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Type Toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => setType('driver')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  type === 'driver'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Drivers
              </button>
              <button
                onClick={() => setType('constructor')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  type === 'constructor'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Constructors
              </button>
            </div>

            {/* Scale Toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => setScale('rank')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scale === 'rank'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Rank
              </button>
              <button
                onClick={() => setScale('points')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scale === 'points'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Points
              </button>
            </div>

            {/* Log Scale Toggle (only visible for 'points' scale) */}
            {scale === 'points' && (
              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
                <label className="text-sm text-slate-300 font-medium cursor-pointer select-none flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={useLogScale} 
                    onChange={(e) => setUseLogScale(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
                  />
                  Log Scale
                </label>
              </div>
            )}
          </div>
        </header>

        <main className="bg-slate-900/50 rounded-2xl p-4 md:p-8 border border-slate-800 backdrop-blur-sm">
          {isLoading ? (
            <div className="h-[500px] flex items-center justify-center text-slate-400">
              Loading data...
            </div>
          ) : error ? (
            <div className="h-[500px] flex items-center justify-center text-red-400">
              Error loading data
            </div>
          ) : (
            <StandingsChart 
              data={data?.series} 
              races={data?.races} 
              scale={scale}
              useLogScale={useLogScale}
            />
          )}
        </main>
      </div>
      <footer className="text-center text-slate-500 text-sm mt-8">
        <p>Data provided by <a href="http://ergast.com/mrd/" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">Ergast Developer API</a></p>
      </footer>
    </div>
  )
}

export default App
