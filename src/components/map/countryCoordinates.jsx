// Static country coordinates for offline geocoding
export const countryCoordinates = {
  // Asia
  'japan': { lat: 36.2048, lon: 138.2529, zoom: 5 },
  'china': { lat: 35.8617, lon: 104.1954, zoom: 4 },
  'india': { lat: 20.5937, lon: 78.9629, zoom: 5 },
  'south korea': { lat: 35.9078, lon: 127.7669, zoom: 6 },
  'korea': { lat: 35.9078, lon: 127.7669, zoom: 6 },
  'thailand': { lat: 15.8700, lon: 100.9925, zoom: 6 },
  'singapore': { lat: 1.3521, lon: 103.8198, zoom: 11 },
  'malaysia': { lat: 4.2105, lon: 101.9758, zoom: 6 },
  'indonesia': { lat: -0.7893, lon: 113.9213, zoom: 5 },
  'philippines': { lat: 12.8797, lon: 121.7740, zoom: 6 },
  'vietnam': { lat: 14.0583, lon: 108.2772, zoom: 6 },
  'taiwan': { lat: 23.6978, lon: 120.9605, zoom: 7 },
  'qatar': { lat: 25.3548, lon: 51.1839, zoom: 8 },
  'uae': { lat: 23.4241, lon: 53.8478, zoom: 7 },
  'united arab emirates': { lat: 23.4241, lon: 53.8478, zoom: 7 },
  'saudi arabia': { lat: 23.8859, lon: 45.0792, zoom: 6 },
  'oman': { lat: 21.4735, lon: 55.9754, zoom: 6 },
  'kuwait': { lat: 29.3117, lon: 47.4818, zoom: 8 },
  'bahrain': { lat: 26.0667, lon: 50.5577, zoom: 10 },
  
  // Europe
  'uk': { lat: 55.3781, lon: -3.4360, zoom: 6 },
  'united kingdom': { lat: 55.3781, lon: -3.4360, zoom: 6 },
  'france': { lat: 46.2276, lon: 2.2137, zoom: 6 },
  'germany': { lat: 51.1657, lon: 10.4515, zoom: 6 },
  'spain': { lat: 40.4637, lon: -3.7492, zoom: 6 },
  'italy': { lat: 41.8719, lon: 12.5674, zoom: 6 },
  'netherlands': { lat: 52.1326, lon: 5.2913, zoom: 7 },
  'belgium': { lat: 50.5039, lon: 4.4699, zoom: 7 },
  'norway': { lat: 60.4720, lon: 8.4689, zoom: 5 },
  'sweden': { lat: 60.1282, lon: 18.6435, zoom: 5 },
  'poland': { lat: 51.9194, lon: 19.1451, zoom: 6 },
  'russia': { lat: 61.5240, lon: 105.3188, zoom: 3 },
  'greece': { lat: 39.0742, lon: 21.8243, zoom: 6 },
  'portugal': { lat: 39.3999, lon: -8.2245, zoom: 6 },
  'turkey': { lat: 38.9637, lon: 35.2433, zoom: 6 },
  
  // Americas
  'usa': { lat: 37.0902, lon: -95.7129, zoom: 4 },
  'united states': { lat: 37.0902, lon: -95.7129, zoom: 4 },
  'canada': { lat: 56.1304, lon: -106.3468, zoom: 4 },
  'mexico': { lat: 23.6345, lon: -102.5528, zoom: 5 },
  'brazil': { lat: -14.2350, lon: -51.9253, zoom: 4 },
  'argentina': { lat: -38.4161, lon: -63.6167, zoom: 5 },
  'chile': { lat: -35.6751, lon: -71.5430, zoom: 5 },
  'colombia': { lat: 4.5709, lon: -74.2973, zoom: 6 },
  'venezuela': { lat: 6.4238, lon: -66.5897, zoom: 6 },
  'peru': { lat: -9.1900, lon: -75.0152, zoom: 5 },
  
  // Africa
  'egypt': { lat: 26.8206, lon: 30.8025, zoom: 6 },
  'south africa': { lat: -30.5595, lon: 22.9375, zoom: 5 },
  'nigeria': { lat: 9.0820, lon: 8.6753, zoom: 6 },
  'algeria': { lat: 28.0339, lon: 1.6596, zoom: 5 },
  'morocco': { lat: 31.7917, lon: -7.0926, zoom: 6 },
  
  // Oceania
  'australia': { lat: -25.2744, lon: 133.7751, zoom: 4 },
  'new zealand': { lat: -40.9006, lon: 174.8860, zoom: 5 },
  
  // Major cities/ports
  'rotterdam': { lat: 51.9225, lon: 4.4792, zoom: 11 },
  'houston': { lat: 29.7604, lon: -95.3698, zoom: 10 },
  'tokyo': { lat: 35.6762, lon: 139.6503, zoom: 10 },
  'shanghai': { lat: 31.2304, lon: 121.4737, zoom: 10 },
  'dubai': { lat: 25.2048, lon: 55.2708, zoom: 10 },
  'singapore': { lat: 1.3521, lon: 103.8198, zoom: 11 },
  'mumbai': { lat: 19.0760, lon: 72.8777, zoom: 10 },
  'london': { lat: 51.5074, lon: -0.1278, zoom: 10 },
  'new york': { lat: 40.7128, lon: -74.0060, zoom: 10 },
  'los angeles': { lat: 34.0522, lon: -118.2437, zoom: 10 },
  'doha': { lat: 25.2854, lon: 51.5310, zoom: 11 },
  'ras laffan': { lat: 25.9333, lon: 51.5500, zoom: 12 }
};

export function searchLocation(query) {
  if (!query || query.length < 2) return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Exact match
  if (countryCoordinates[normalizedQuery]) {
    const coords = countryCoordinates[normalizedQuery];
    return { position: [coords.lat, coords.lon], zoom: coords.zoom };
  }
  
  // Partial match
  const matchingKey = Object.keys(countryCoordinates).find(key => 
    key.includes(normalizedQuery) || normalizedQuery.includes(key)
  );
  
  if (matchingKey) {
    const coords = countryCoordinates[matchingKey];
    return { position: [coords.lat, coords.lon], zoom: coords.zoom };
  }
  
  return null;
}