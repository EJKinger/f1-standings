export const countryToIso = {
  "Bahrain": "bh",
  "Saudi Arabia": "sa",
  "Australia": "au",
  "Japan": "jp",
  "China": "cn",
  "USA": "us",
  "United States": "us",
  "Miami": "us", // Special case if API returns Miami as country (unlikely but safe)
  "Italy": "it",
  "Monaco": "mc",
  "Canada": "ca",
  "Spain": "es",
  "Austria": "at",
  "UK": "gb",
  "Great Britain": "gb",
  "Hungary": "hu",
  "Belgium": "be",
  "Netherlands": "nl",
  "Singapore": "sg",
  "Azerbaijan": "az",
  "Qatar": "qa",
  "Mexico": "mx",
  "Brazil": "br",
  "Las Vegas": "us",
  "Abu Dhabi": "ae",
  "UAE": "ae",
  "Portugal": "pt",
  "France": "fr",
  "Russia": "ru",
  "Turkey": "tr",
  "Germany": "de",
  "Malaysia": "my",
  "Korea": "kr",
  "India": "in"
};

export const getCountryFlagUrl = (countryName) => {
  const code = countryToIso[countryName] || 'xx'; // 'xx' is a placeholder or unknown
  return `https://flagcdn.com/w40/${code}.png`;
};
