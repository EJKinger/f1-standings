import { useState, useMemo } from 'react';
import { ResponsiveBump } from '@nivo/bump'
import { ResponsiveLine } from '@nivo/line'
import { getCountryFlagUrl } from '../utils/countries';

const CustomTick = ({ x, y, value, raceName, country, onHover, onLeave }) => {
  return (
    <g transform={`translate(${x},${y + 20})`}>
      <image
        href={getCountryFlagUrl(country)}
        x={-12}
        y={-12}
        height={24}
        width={24}
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => onHover(e, raceName)}
        onMouseLeave={onLeave}
      />
    </g>
  );
};

const StandingsChart = ({ data, races, scale = 'rank' }) => {
  const [hoveredRace, setHoveredRace] = useState(null);

  if (!data || data.length === 0) return null;

  // Create a map for quick lookup of race details by race name (which is the x value)
  const raceMap = new Map();
  if (races) {
    races.forEach(r => raceMap.set(r.name, r));
  }

  const handleFlagHover = (event, raceName) => {
    const rect = event.target.getBoundingClientRect();
    setHoveredRace({
      name: raceName,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleFlagLeave = () => {
    setHoveredRace(null);
  };

  // Transform data for Points view if needed
  const chartData = useMemo(() => {
    if (scale === 'points') {
      return data.map(serie => ({
        ...serie,
        data: serie.data.map(d => ({
          ...d,
          y: d.points !== null ? parseFloat(d.points) : null
        }))
      }));
    }
    return data;
  }, [data, scale]);

  const commonProps = {
    data: chartData,
    margin: { top: 40, right: 140, bottom: 80, left: 100 },
    colors: { scheme: 'nivo' },
    theme: {
      axis: {
        ticks: {
          text: { fill: '#94a3b8' }
        },
        legend: {
          text: { fill: '#94a3b8' }
        }
      },
      grid: {
        line: { stroke: '#334155', strokeWidth: 1 }
      }
    }
  };

  const [hoveredDriver, setHoveredDriver] = useState(null);

  const HeadshotLayer = ({ series, xScale, yScale }) => {
    return series.map(serie => {
      const points = serie.data;
      if (!points || points.length === 0) return null;

      const validPoints = points.filter(p => p.data.y !== null);
      if (validPoints.length === 0) return null;
      
      const firstPoint = validPoints[0];
      const lastPoint = validPoints[validPoints.length - 1];

      const startX = xScale(firstPoint.data.x);
      const startY = yScale(firstPoint.data.y);
      const endX = xScale(lastPoint.data.x);
      const endY = yScale(lastPoint.data.y);

      // Constructor Logic (No familyName in meta)
      if (!serie.meta?.familyName) {
        const ConstructorLabel = ({ x, y, align = 'left' }) => (
          <text
            x={align === 'left' ? x - 10 : x + 10}
            y={y}
            textAnchor={align === 'left' ? 'end' : 'start'}
            dominantBaseline="central"
            style={{ 
              fill: serie.color, 
              fontSize: '12px', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            {serie.id}
          </text>
        );

        return (
          <g key={serie.id}>
            <ConstructorLabel x={startX} y={startY} align="left" />
            <ConstructorLabel x={endX} y={endY} align="right" />
          </g>
        );
      }
      
      // Driver Logic
      // Fix casing for F1 media URLs (Title Case required: "Verstappen", not "verstappen")
      const familyName = serie.meta.familyName.charAt(0).toUpperCase() + serie.meta.familyName.slice(1).toLowerCase();
      const imageUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/${familyName}.png`;
      const fallbackUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2024Drivers/${familyName}.png`;

      const size = 40;
      const offset = 45;

      const handleDriverHover = (e, x, y, align) => {
        const rect = e.target.getBoundingClientRect();
        setHoveredDriver({
          id: serie.id,
          imageUrl,
          fallbackUrl,
          color: serie.color,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          align
        });
      };

      const DriverImage = ({ x, y, align = 'left' }) => (
        <foreignObject 
          x={align === 'left' ? x - offset - size : x + offset} 
          y={y - size / 2} 
          width={size + 60} 
          height={size}
          style={{ overflow: 'visible' }}
        >
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            style={{ flexDirection: align === 'left' ? 'row' : 'row-reverse' }}
            onMouseEnter={(e) => handleDriverHover(e, x, y, align)}
            onMouseLeave={() => setHoveredDriver(null)}
          >
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border-2 transition-all"
                style={{ borderColor: serie.color }}
              >
                <img 
                  src={imageUrl} 
                  alt={serie.id} 
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = fallbackUrl}
                />
              </div>
            </div>
            <span className="font-bold text-sm text-slate-300 font-mono">{serie.id}</span>
          </div>
        </foreignObject>
      );

      return (
        <g key={serie.id}>
          <DriverImage x={startX} y={startY} align="left" />
          <DriverImage x={endX} y={endY} align="right" />
        </g>
      );
    });
  };

  return (
    <div className="h-[500px] md:h-[700px] w-full relative">
      {hoveredRace && (
        <div 
          className="fixed z-50 bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded border border-slate-600 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: hoveredRace.x, top: hoveredRace.y }}
        >
          {hoveredRace.name}
        </div>
      )}

      {hoveredDriver && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: hoveredDriver.x, top: hoveredDriver.y }}
        >
           <div className="flex items-center gap-2" style={{ flexDirection: hoveredDriver.align === 'left' ? 'row' : 'row-reverse' }}>
            <div 
              className="w-20 h-20 rounded-full overflow-hidden bg-slate-800 border-4 shadow-2xl"
              style={{ borderColor: hoveredDriver.color }}
            >
              <img 
                src={hoveredDriver.imageUrl} 
                alt={hoveredDriver.id} 
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = hoveredDriver.fallbackUrl}
              />
            </div>
            <span className="font-bold text-lg text-white font-mono shadow-black drop-shadow-md">{hoveredDriver.id}</span>
          </div>
        </div>
      )}
      
      {scale === 'rank' ? (
        <ResponsiveBump
          {...commonProps}
          lineWidth={3}
          activeLineWidth={6}
          inactiveLineWidth={3}
          inactiveOpacity={0.15}
          pointSize={10}
          activePointSize={16}
          inactivePointSize={0}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={3}
          activePointBorderWidth={3}
          pointBorderColor={{ from: 'serie.color' }}
          axisTop={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 20,
            tickRotation: 0,
            legend: '',
            renderTick: (tick) => {
              const race = raceMap.get(tick.value);
              if (!race) return null;
              return (
                <CustomTick 
                  x={tick.x} 
                  y={tick.y} 
                  value={tick.value} 
                  raceName={race.name} 
                  country={race.country}
                  onHover={handleFlagHover}
                  onLeave={handleFlagLeave}
                />
              );
            }
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Ranking',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          axisRight={null}
          useMesh={true}
          enableGridX={false}
          enableGridY={false}
          layers={[
            'grid', 'axes', 'labels', 'lines', 'points', 'mesh',
            HeadshotLayer
          ]}
          tooltip={({ serie }) => {
            const familyName = serie.meta?.familyName ? (serie.meta.familyName.charAt(0).toUpperCase() + serie.meta.familyName.slice(1).toLowerCase()) : '';
            const imageUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/${familyName}.png`;
            
            return (
              <div className="bg-slate-900 p-3 border border-slate-700 rounded shadow-xl text-xs flex items-center gap-3">
                {serie.meta?.familyName && (
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                    <img 
                      src={imageUrl} 
                      alt={serie.id} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2024Drivers/${familyName}.png`;
                      }}
                    />
                  </div>
                )}
                <div>
                  <div className="font-bold mb-1 text-sm" style={{ color: serie.color }}>
                    {serie.id}
                  </div>
                  <div className="text-slate-400">
                    Current Rank: <span className="text-white font-mono text-lg">{serie.data[serie.data.length - 1].y}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {serie.data[serie.data.length - 1].points} pts
                  </div>
                </div>
              </div>
            );
          }}
        />
      ) : (
        <ResponsiveLine
          {...commonProps}
          curve="monotoneX"
          enablePoints={true}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serie.color' }}
          enableGridX={false}
          enableGridY={true}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 20,
            tickRotation: 0,
            legend: '',
            renderTick: (tick) => {
              const race = raceMap.get(tick.value);
              if (!race) return null;
              return (
                <CustomTick 
                  x={tick.x} 
                  y={tick.y} 
                  value={tick.value} 
                  raceName={race.name} 
                  country={race.country}
                  onHover={handleFlagHover}
                  onLeave={handleFlagLeave}
                />
              );
            }
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Points',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          useMesh={true}
          layers={[
            'grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'points', 'slices', 'mesh', 'legends',
            HeadshotLayer
          ]}
          tooltip={({ point }) => {
            const serie = point.serieId ? chartData.find(s => s.id === point.serieId) : null;
            const familyName = serie?.meta?.familyName ? (serie.meta.familyName.charAt(0).toUpperCase() + serie.meta.familyName.slice(1).toLowerCase()) : '';
            const imageUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/${familyName}.png`;
            
            return (
              <div className="bg-slate-900 p-3 border border-slate-700 rounded shadow-xl text-xs flex items-center gap-3">
                {serie?.meta?.familyName && (
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                    <img 
                      src={imageUrl} 
                      alt={serie.id} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2024Drivers/${familyName}.png`;
                      }}
                    />
                  </div>
                )}
                <div>
                  <div className="font-bold mb-1 text-sm" style={{ color: point.serieColor }}>
                    {point.serieId}
                  </div>
                  <div className="text-slate-400">
                    Points: <span className="text-white font-mono text-lg">{point.data.y}</span>
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  )
}

export default StandingsChart
