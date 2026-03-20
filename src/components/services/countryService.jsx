/**
 * Country data service - master data for ISO country codes
 */

import { base44 } from '@/api/base44Client';
import { generateUUID } from '../utils/uuid';

export async function listCountries(activeOnly = true) {
  const countries = await base44.entities.Country.list('-nameEn', 300);
  return activeOnly ? countries.filter(c => c.isActive !== false) : countries;
}

export async function getCountryByIso2(iso2) {
  const countries = await base44.entities.Country.filter({ iso2: iso2.toUpperCase() });
  return countries[0] || null;
}

export async function getCountryByIso3(iso3) {
  const countries = await base44.entities.Country.filter({ iso3: iso3.toUpperCase() });
  return countries[0] || null;
}

export async function createCountry(data) {
  return await base44.entities.Country.create({
    ...data,
    publicId: generateUUID(),
    iso2: data.iso2.toUpperCase(),
    iso3: data.iso3?.toUpperCase()
  });
}

/**
 * Match a free-text country string to a Country record
 */
export async function matchCountryFromText(text) {
  if (!text) return null;
  
  const normalized = text.trim().toLowerCase();
  const countries = await listCountries(false);
  
  // Common aliases
  const aliases = {
    'uae': 'AE',
    'united arab emirates': 'AE',
    'uk': 'GB',
    'united kingdom': 'GB',
    'usa': 'US',
    'united states': 'US',
    'united states of america': 'US',
    'russia': 'RU',
    'russian federation': 'RU',
    'serbia': 'RS'
  };
  
  // Check alias first
  if (aliases[normalized]) {
    return countries.find(c => c.iso2 === aliases[normalized]);
  }
  
  // Exact match on nameEn
  let match = countries.find(c => c.nameEn?.toLowerCase() === normalized);
  if (match) return match;
  
  // Match on ISO2
  match = countries.find(c => c.iso2?.toLowerCase() === normalized);
  if (match) return match;
  
  // Match on ISO3
  match = countries.find(c => c.iso3?.toLowerCase() === normalized);
  if (match) return match;
  
  return null;
}