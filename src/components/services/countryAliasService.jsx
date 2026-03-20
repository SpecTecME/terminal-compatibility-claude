import { base44 } from '@/api/base44Client';

/**
 * Resolves a country reference from user input or seed/import data
 * 
 * Resolution order:
 * 1. Try exact match on Country.nameEn
 * 2. Try case-insensitive match on CountryAlias.alias
 * 3. Return null if not found (do not create a Country)
 * 
 * @param {string} countryInput - The country name or alias to resolve
 * @returns {Promise<Object|null>} - Country object or null if not found
 */
export async function resolveCountry(countryInput) {
  if (!countryInput || typeof countryInput !== 'string') {
    return null;
  }

  const trimmedInput = countryInput.trim();
  if (!trimmedInput) {
    return null;
  }

  try {
    // Step 1: Try exact match on Country.nameEn
    const countries = await base44.entities.Country.list();
    let country = countries.find(c => c.nameEn === trimmedInput);
    
    if (country) {
      return country;
    }

    // Step 2: Try case-insensitive match on CountryAlias.alias
    const aliases = await base44.entities.CountryAlias.filter({ isActive: true });
    const matchingAlias = aliases.find(a => 
      a.alias.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (matchingAlias) {
      country = countries.find(c => c.id === matchingAlias.countryId);
      if (country) {
        return country;
      }
    }

    // Step 3: Not found - log warning
    console.warn(`Country resolution failed for input: "${countryInput}"`);
    return null;
  } catch (error) {
    console.error('Error resolving country:', error);
    return null;
  }
}

/**
 * Resolves a country ID from user input
 * @param {string} countryInput - The country name or alias
 * @returns {Promise<string|null>} - Country ID or null
 */
export async function resolveCountryId(countryInput) {
  const country = await resolveCountry(countryInput);
  return country?.id || null;
}

/**
 * Resolves multiple countries in batch
 * @param {string[]} countryInputs - Array of country names or aliases
 * @returns {Promise<Map<string, Object>>} - Map of input -> Country object
 */
export async function resolveCountriesBatch(countryInputs) {
  const results = new Map();
  
  for (const input of countryInputs) {
    if (input) {
      const country = await resolveCountry(input);
      results.set(input, country);
    }
  }
  
  return results;
}

/**
 * Search countries by name or alias (for UI search functionality)
 * @param {string} searchTerm - Search term
 * @returns {Promise<Object[]>} - Array of matching countries
 */
export async function searchCountries(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return [];
  }

  const term = searchTerm.toLowerCase();
  
  try {
    const countries = await base44.entities.Country.list();
    const aliases = await base44.entities.CountryAlias.filter({ isActive: true });
    
    // Find countries matching by nameEn
    const matchingCountries = new Set();
    
    countries.forEach(c => {
      if (c.nameEn && c.nameEn.toLowerCase().includes(term)) {
        matchingCountries.add(c.id);
      }
    });
    
    // Find countries matching by alias
    aliases.forEach(a => {
      if (a.alias && a.alias.toLowerCase().includes(term)) {
        matchingCountries.add(a.countryId);
      }
    });
    
    // Return unique countries
    return countries.filter(c => matchingCountries.has(c.id));
  } catch (error) {
    console.error('Error searching countries:', error);
    return [];
  }
}