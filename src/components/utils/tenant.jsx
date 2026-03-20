/**
 * Tenant management for multi-tenancy support
 * In production, this would come from user session/JWT
 */

const TENANT_STORAGE_KEY = 'app_tenant_id';

/**
 * Get current tenant ID
 * For now, use a stored value. In production, extract from user token.
 * @returns {string}
 */
export function getCurrentTenantId() {
  let tenantId = localStorage.getItem(TENANT_STORAGE_KEY);
  
  if (!tenantId) {
    // Default tenant for demo purposes
    tenantId = 'default-tenant';
    localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  }
  
  return tenantId;
}

/**
 * Set tenant ID (for testing/admin purposes)
 * @param {string} tenantId 
 */
export function setTenantId(tenantId) {
  localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
}

/**
 * Add tenant filter to query
 * @param {object} query 
 * @returns {object}
 */
export function addTenantFilter(query = {}) {
  return {
    ...query,
    tenantId: getCurrentTenantId()
  };
}