import { useQuery } from '@tanstack/react-query';
import { getSchedule, getStandingsForRound } from '../api/client';

export const useSeasonStandings = (year, type = 'driver') => {
  return useQuery({
    queryKey: ['seasonStandings', year, type],
    queryFn: async () => {
      // 1. Get Schedule
      const schedule = await getSchedule(year);
      
      // Filter for completed races.
      // If we are in the future relative to the race, it should be completed.
      // However, sometimes the API might not have results yet even if the date passed.
      // We'll try to fetch all races that have passed.
      const now = new Date();
      const completedRaces = schedule.filter(race => {
        const raceDate = new Date(`${race.date}T${race.time || '00:00:00'}`);
        return raceDate < now;
      });

      // 2. Fetch standings for each completed round
      const standingsPromises = completedRaces.map(race => 
        getStandingsForRound(year, race.round, type)
          .then(data => ({
            round: race.round,
            raceName: race.raceName,
            circuitId: race.Circuit.circuitId,
            standings: type === 'driver' ? (data?.DriverStandings || []) : (data?.ConstructorStandings || [])
          }))
          .catch(err => {
            console.warn(`Failed to fetch standings for round ${race.round}`, err);
            return null;
          })
      );

      const roundsData = await Promise.all(standingsPromises);
      const validRounds = roundsData.filter(r => r !== null && r.standings.length > 0);

      // 3. Transform for Nivo Bump Chart
      // First, build a lookup of standings by round and entity ID
      const standingsLookup = new Map(); // Map<RoundNumber, Map<EntityId, Standing>>
      const allEntities = new Map(); // Map<EntityId, EntityInfo>

      // Fetch driver images from OpenF1 if type is driver
      let driverImages = new Map();
      if (type === 'driver') {
        try {
          // Fetch drivers from OpenF1 for the current/recent session to get headshots
          // We can't easily filter by year in OpenF1 drivers endpoint without a session key.
          // But we can try to fetch a list and match by driver number or name.
          // Actually, OpenF1 is great but might be overkill to fetch for every request.
          // Let's try a static list or a known public CDN if possible.
          // But since we are here, let's try to fetch from a known OpenF1 session if possible, or just use the static pattern with better error handling.
          // Alternatively, use a different source.
          // Let's stick to the static pattern but fix the casing.
          // The user said "I don't see the images".
          // Let's try to use a different, more reliable source or just fix the casing.
          // Actually, let's try to fetch from OpenF1 for a recent session (e.g. latest race of the year).
          // We have the schedule. Let's pick the last completed race.
          
          if (validRounds.length > 0) {
             // This is getting complicated to fetch session keys.
             // Let's try to use the static URL with lowercase.
          }
        } catch (e) {
          console.warn("Failed to fetch driver images", e);
        }
      }
      
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

