/**
 * Terminal data service - abstracts Base44 data access
 * Handles publicId generation, tenantId injection, and relationship tracking
 */

import { base44 } from '@/api/base44Client';
import { generateUUID } from '../utils/uuid';
import { getCurrentTenantId, addTenantFilter } from '../utils/tenant';

/**
 * List all terminals for current tenant
 */
export async function listTerminals(sortBy = '-created_date', limit = 100) {
  return await base44.entities.Terminal.filter(
    addTenantFilter(),
    sortBy,
    limit
  );
}

/**
 * Get terminal by Base44 id
 */
export async function getTerminalById(id) {
  const terminals = await base44.entities.Terminal.filter(
    addTenantFilter({ id })
  );
  return terminals[0] || null;
}

/**
 * Get terminal by publicId
 */
export async function getTerminalByPublicId(publicId) {
  const terminals = await base44.entities.Terminal.filter(
    addTenantFilter({ publicId })
  );
  return terminals[0] || null;
}

/**
 * Create a new terminal
 */
export async function createTerminal(data) {
  const terminal = {
    ...data,
    publicId: generateUUID(),
    tenantId: getCurrentTenantId(),
    created_date: new Date().toISOString()
  };
  
  return await base44.entities.Terminal.create(terminal);
}

/**
 * Update terminal
 */
export async function updateTerminal(id, data) {
  // Prevent changing immutable fields
  const { publicId, tenantId, ...updateData } = data;
  return await base44.entities.Terminal.update(id, updateData);
}

/**
 * Delete terminal
 */
export async function deleteTerminal(id) {
  return await base44.entities.Terminal.delete(id);
}

/**
 * Search terminals by name or location (within tenant)
 */
export async function searchTerminals(searchQuery) {
  const allTerminals = await listTerminals();
  
  if (!searchQuery) return allTerminals;
  
  const query = searchQuery.toLowerCase();
  return allTerminals.filter(t => 
    t.name?.toLowerCase().includes(query) ||
    t.country?.toLowerCase().includes(query) ||
    t.port?.toLowerCase().includes(query) ||
    t.countryCode?.toLowerCase().includes(query)
  );
}