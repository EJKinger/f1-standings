import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../src/data');
const CACHE_FILE = path.join(DATA_DIR, 'standings-cache.json');
const YEARS = [2021, 2022, 2023, 2024, 2025];
const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const client = axios.create({
  baseURL: BASE_URL,
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, retries = 5, backoff = 2000) => {
  try {
    return await client.get(url);
  } catch (error) {
    if (retries > 0 && (error.response?.status === 429 || error.code === 'ECONNRESET')) {
      console.log(`Rate limited or connection error for ${url}. Retrying in ${backoff}ms... (${retries} retries left)`);
      await delay(backoff);
      return fetchWithRetry(url, retries - 1, backoff * 1.5);
    }
    throw error;
  }
};

const getSchedule = async (year) => {
  console.log(`Fetching schedule for ${year}...`);
  try {
    const response = await fetchWithRetry(`/${year}.json`);
    return response.data.MRData.RaceTable.Races;
  } catch (error) {
    console.error(`Error fetching schedule for ${year}:`, error.message);
    return [];
  }
};

const getStandings = async (year, round, type) => {
  const endpoint = type === 'driver' ? 'driverStandings' : 'constructorStandings';
  try {
    const response = await fetchWithRetry(`/${year}/${round}/${endpoint}.json`);
    return response.data.MRData.StandingsTable.StandingsLists[0];
  } catch (error) {
    console.error(`Error fetching ${type} standings for ${year} round ${round}:`, error.message);
    return null;
  }
};

// Main execution function

const fetchAllData = async () => {
  const cache = {};
  
  // Load existing cache if it exists to avoid re-fetching everything if we run this often
  // For now, let's just rebuild it to be safe and simple
  
  for (const year of YEARS) {
    cache[year] = {
      schedule: [],
      driverStandings: {},
      constructorStandings: {}
    };

    const schedule = await getSchedule(year);
    cache[year].schedule = schedule;

    const now = new Date();
    const completedRaces = schedule.filter(race => {
      const raceDate = new Date(`${race.date}T${race.time || '00:00:00'}`);
      return raceDate < now;
    });

    console.log(`Found ${completedRaces.length} completed races for ${year}`);

    for (const race of completedRaces) {
      const round = race.round;
      
      // Fetch Driver Standings
      console.log(`Fetching Driver Standings: ${year} Round ${round}`);
      const driverData = await getStandings(year, round, 'driver');
      if (driverData) {
        cache[year].driverStandings[round] = driverData;
      }
      await delay(500); // Base delay

      // Fetch Constructor Standings
      console.log(`Fetching Constructor Standings: ${year} Round ${round}`);
      const constructorData = await getStandings(year, round, 'constructor');
      if (constructorData) {
        cache[year].constructorStandings[round] = constructorData;
      }
      await delay(500);
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`Data cached successfully to ${CACHE_FILE}`);
};

fetchAllData();
