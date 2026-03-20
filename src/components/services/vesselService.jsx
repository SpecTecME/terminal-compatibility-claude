/**
 * Vessel data service - abstracts Base44 data access
 */

import { base44 } from '@/api/base44Client';
import { generateUUID } from '../utils/uuid';
import { getCurrentTenantId, addTenantFilter } from '../utils/tenant';

export async function listVessels(sortBy = '-created_date', limit = 100) {
  return await base44.entities.Vessel.filter(
    addTenantFilter(),
    sortBy,
    limit
  );
}

export async function getVesselById(id) {
  const vessels = await base44.entities.Vessel.filter(
    addTenantFilter({ id })
  );
  return vessels[0] || null;
}

export async function getVesselByPublicId(publicId) {
  const vessels = await base44.entities.Vessel.filter(
    addTenantFilter({ publicId })
  );
  return vessels[0] || null;
}

export async function createVessel(data) {
  const vessel = {
    ...data,
    publicId: generateUUID(),
    tenantId: getCurrentTenantId()
  };
  
  return await base44.entities.Vessel.create(vessel);
}

export async function updateVessel(id, data) {
  const { publicId, tenantId, ...updateData } = data;
  return await base44.entities.Vessel.update(id, updateData);
}

export async function deleteVessel(id) {
  return await base44.entities.Vessel.delete(id);
}