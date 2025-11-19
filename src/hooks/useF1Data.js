import { useQuery } from '@tanstack/react-query';
import { getSchedule, getStandingsForRound } from '../api/client';
import standingsCache from '../data/standings-cache.json';

export const useSeasonStandings = (year, type = 'driver') => {
  return useQuery({
    queryKey: ['seasonStandings', year, type],
    queryFn: async () => {
      // 1. Get Schedule
      // Try to get schedule from cache first if available for that year
      let schedule = standingsCache[year]?.schedule;
      
      // If not in cache or we want to ensure we have latest race times for current year, fetch it
      // For past years, cache is fine. For current year, we might want fresh schedule in case of changes?
      // But user asked to "only hit the api for future races".
      // So if we have it in cache, use it.
      if (!schedule || schedule.length === 0) {
         schedule = await getSchedule(year);
      }

      // Filter for completed races.
      const now = new Date();
      const completedRaces = schedule.filter(race => {
        const raceDate = new Date(`${race.date}T${race.time || '00:00:00'}`);
        return raceDate < now;
      });

      // 2. Fetch standings for each completed round
      const standingsPromises = completedRaces.map(async (race) => {
        const round = race.round;
        
        // Check cache first
        const cachedYear = standingsCache[year];
        if (cachedYear) {
          const cachedStandings = type === 'driver' 
            ? cachedYear.driverStandings[round] 
            : cachedYear.constructorStandings[round];
            
          if (cachedStandings) {
            return {
              round: race.round,
              raceName: race.raceName,
              circuitId: race.Circuit.circuitId,
              standings: type === 'driver' ? (cachedStandings.DriverStandings || []) : (cachedStandings.ConstructorStandings || [])
            };
          }
        }

        // If not in cache, fetch from API
        try {
          const data = await getStandingsForRound(year, race.round, type);
          return {
            round: race.round,
            raceName: race.raceName,
            circuitId: race.Circuit.circuitId,
            standings: type === 'driver' ? (data?.DriverStandings || []) : (data?.ConstructorStandings || [])
          };
        } catch (err) {
          console.warn(`Failed to fetch standings for round ${race.round}`, err);
          return null;
        }
      });

      const roundsData = await Promise.all(standingsPromises);
      const validRounds = roundsData.filter(r => r !== null && r.standings.length > 0);

      // 3. Transform for Nivo Bump Chart
      // First, build a lookup of standings by round and entity ID
      const standingsLookup = new Map(); // Map<RoundNumber, Map<EntityId, Standing>>
      const allEntities = new Map(); // Map<EntityId, EntityInfo>

      validRounds.forEach(roundData => {
        const roundNum = parseInt(roundData.round);
        if (!standingsLookup.has(roundNum)) {
          standingsLookup.set(roundNum, new Map());
        }
        
        roundData.standings.forEach(standing => {
          const entityId = type === 'driver' ? standing.Driver.driverId : standing.Constructor.constructorId;
          const entityName = type === 'driver' 
            ? (standing.Driver.code || standing.Driver.familyName) 
            : standing.Constructor.name;
            
          // Store entity info if not seen
          if (!allEntities.has(entityId)) {
            allEntities.set(entityId, {
              id: entityName,
              meta: type === 'driver' ? standing.Driver : standing.Constructor,
            });
          }
          
          standingsLookup.get(roundNum).set(entityId, standing);
        });
      });

      // Now build the series for every entity found, covering ALL completed races
      const series = Array.from(allEntities.entries()).map(([entityId, entityInfo]) => {
        const dataPoints = completedRaces.map(race => {
          const roundNum = parseInt(race.round);
          const roundStandings = standingsLookup.get(roundNum);
          const standing = roundStandings?.get(entityId);

          if (standing) {
            return {
              x: race.raceName,
              y: parseInt(standing.position),
              round: roundNum,
              points: standing.points,
              wins: standing.wins
            };
          } else {
            // Missing data for this round
            return {
              x: race.raceName,
              y: null,
              round: roundNum,
              points: null,
              wins: null
            };
          }
        });

        return {
          id: entityInfo.id,
          meta: entityInfo.meta,
          data: dataPoints
        };
      });

      return {
        series: series,
        races: completedRaces.map(r => ({
          round: parseInt(r.round),
          name: r.raceName,
          country: r.Circuit.Location.country
        }))
      };

    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

