import axios from 'axios';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';


export const f1Client = axios.create({
  baseURL: BASE_URL,
});

export const getSchedule = async (year) => {
  const response = await f1Client.get(`/${year}.json`);
  return response.data.MRData.RaceTable.Races;
};

export const getStandingsForRound = async (year, round, type = 'driver') => {
  const endpoint = type === 'driver' ? 'driverStandings' : 'constructorStandings';
  const response = await f1Client.get(`/${year}/${round}/${endpoint}.json`);
  return response.data.MRData.StandingsTable.StandingsLists[0];
};


