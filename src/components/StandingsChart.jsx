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

  const HeadshotLayer = ({ series, xScale, yScale }) => {
    return series.map(serie => {
      // Only show for drivers if we have meta
      // Note: Nivo Line passes 'serie' slightly differently than Bump, check structure
      // For Line: serie.data is the array of points.
      // For Bump: same.
      // But we need access to the original 'meta' property.
      // In Nivo Line, extra props on the series object are passed through.
      
      if (!serie.meta?.familyName) return null;
      
      const familyName = serie.meta.familyName.toLowerCase();
      const imageUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/${familyName}.png`;
      const fallbackUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2024Drivers/${familyName}.png`;

      // Get start and end points
      // For Line chart, we need to find the coordinates.
      // series is an array of { id, data: [{x, y, data: {originalData}}] }
      // Wait, in custom layer for Line, 'series' contains computed x,y coordinates.
      
      const points = serie.data; // Array of { x, y, data }
      if (!points || points.length === 0) return null;

      // Filter points that have a valid y value (not null)
      const validPoints = points.filter(p => p.data.y !== null);
      if (validPoints.length === 0) return null;
      
      const firstPoint = validPoints[0];
      const lastPoint = validPoints[validPoints.length - 1];

      // Calculate coordinates using scales to be safe
      // Nivo Line points in custom layers usually have x,y as coordinates, but let's ensure we get the right values
      // We use the original data x/y and the scales
      
      const startX = xScale(firstPoint.data.x);
      const startY = yScale(firstPoint.data.y);
      const endX = xScale(lastPoint.data.x);
      const endY = yScale(lastPoint.data.y);

      const size = 24;
      const offset = 30;

      return (
        <g key={serie.id}>
          {/* Start Image */}
          <foreignObject 
            x={startX - offset - size} 
            y={startY - size / 2} 
            width={size} 
            height={size}
            style={{ overflow: 'visible' }}
          >
            <div 
              className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border-2"
              style={{ borderColor: serie.color }}
            >
              <img 
                src={imageUrl} 
                alt={serie.id} 
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = fallbackUrl}
              />
            </div>
          </foreignObject>

          {/* End Image */}
          <foreignObject 
            x={endX + offset} 
            y={endY - size / 2} 
            width={size} 
            height={size}
            style={{ overflow: 'visible' }}
          >
            <div 
              className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border-2"
              style={{ borderColor: serie.color }}
            >
              <img 
                src={imageUrl} 
                alt={serie.id} 
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = fallbackUrl}
              />
            </div>
          </foreignObject>
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
            const familyName = serie.meta?.familyName ? serie.meta.familyName.toLowerCase() : '';
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
            const familyName = serie?.meta?.familyName ? serie.meta.familyName.toLowerCase() : '';
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
