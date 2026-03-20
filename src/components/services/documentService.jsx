/**
 * Document data service
 */

import { base44 } from '@/api/base44Client';
import { generateUUID } from '../utils/uuid';
import { getCurrentTenantId, addTenantFilter } from '../utils/tenant';

export async function listDocuments(sortBy = '-created_date', limit = 100) {
  return await base44.entities.Document.filter(
    addTenantFilter(),
    sortBy,
    limit
  );
}

export async function getDocumentById(id) {
  const documents = await base44.entities.Document.filter(
    addTenantFilter({ id })
  );
  return documents[0] || null;
}

export async function getDocumentsByVessel(vesselId) {
  return await base44.entities.Document.filter(
    addTenantFilter({ vessel_id: vesselId })
  );
}

export async function createDocument(data, referencedEntities = {}) {
  // Capture publicIds of referenced entities for migration portability
  const document = {
    ...data,
    publicId: generateUUID(),
    tenantId: getCurrentTenantId(),
    // Store both Base44 id and publicId for relationships
    vesselPublicId: referencedEntities.vessel?.publicId,
    documentTypePublicId: referencedEntities.documentType?.publicId,
    issuingAuthorityPublicId: referencedEntities.issuingAuthority?.publicId
  };
  
  return await base44.entities.Document.create(document);
}

export async function updateDocument(id, data) {
  const { publicId, tenantId, ...updateData } = data;
  return await base44.entities.Document.update(id, updateData);
}

export async function deleteDocument(id) {
  return await base44.entities.Document.delete(id);
}