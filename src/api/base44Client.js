/**
 * base44Client mock — replaces @base44/sdk for local development.
 *
 * Key entities (Terminal, Vessel, Company, Document, Berth, Country) have
 * realistic seed data and a live in-memory store so list/filter/create/
 * update/delete all work within the session.
 *
 * All other entities fall back to the generic no-op proxy.
 *
 * Replace individual stores with real API calls as the backend is built.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _nextId = 1000;
const genId = () => String(++_nextId);

const noop = () => Promise.resolve(null);

/**
 * Apply a Base44-style filter query to an array of records.
 * Supports: simple equality, { $in: [...] }, { $ne: value }.
 */
function applyFilter(records, query = {}) {
  return records.filter(record =>
    Object.entries(query).every(([key, condition]) => {
      if (condition && typeof condition === 'object') {
        if ('$in' in condition) return condition.$in.includes(record[key]);
        if ('$ne' in condition) return record[key] !== condition.$ne;
      }
      return record[key] === condition;
    })
  );
}

/**
 * Apply a Base44-style sort key (e.g. '-created_date', 'nameEn') to an array.
 */
function applySort(records, sortBy) {
  if (!sortBy) return records;
  const desc = sortBy.startsWith('-');
  const field = desc ? sortBy.slice(1) : sortBy;
  return [...records].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  });
}

/**
 * Build a live in-memory store from a seed array.
 * Records must have an `id` field.
 */
function makeStore(seed) {
  const rows = seed.map(r => ({ ...r }));

  return {
    list(sortBy, limit) {
      let result = applySort(rows, sortBy);
      if (limit) result = result.slice(0, limit);
      return Promise.resolve(result);
    },
    filter(query, sortBy, limit) {
      let result = applyFilter(rows, query);
      result = applySort(result, sortBy);
      if (limit) result = result.slice(0, limit);
      return Promise.resolve(result);
    },
    create(data) {
      const record = { id: genId(), created_date: new Date().toISOString(), ...data };
      rows.push(record);
      return Promise.resolve(record);
    },
    update(id, data) {
      const idx = rows.findIndex(r => r.id === id);
      if (idx !== -1) Object.assign(rows[idx], data);
      return Promise.resolve(rows[idx] ?? null);
    },
    delete(id) {
      const idx = rows.findIndex(r => r.id === id);
      if (idx !== -1) rows.splice(idx, 1);
      return Promise.resolve(null);
    },
    bulkCreate(items) {
      const created = items.map(data => {
        const record = { id: genId(), created_date: new Date().toISOString(), ...data };
        rows.push(record);
        return record;
      });
      return Promise.resolve(created);
    },
  };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const TENANT = 'default-tenant';

// Country reads come from the real backend. Writes are not yet implemented.
const countries = {
  async list(sortBy, limit) {
    const res = await fetch('http://localhost:5254/api/countries');
    let rows = await res.json();
    rows = applySort(rows, sortBy);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  },
  async filter(query, sortBy, limit) {
    const res = await fetch('http://localhost:5254/api/countries');
    let rows = await res.json();
    rows = applyFilter(rows, query);
    rows = applySort(rows, sortBy);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  },
  create:     (data) => Promise.resolve({ id: genId(), ...data }),
  update:     noop,
  delete:     noop,
  bulkCreate: (items) => Promise.resolve(items.map(d => ({ id: genId(), ...d }))),
};

const companies = makeStore([
  {
    id: 'co-1', publicId: 'pub-co-1', tenantId: TENANT,
    name: 'QatarEnergy LNG', type: 'Operator',
    countryId: 'c-qa', email: 'info@qatarenergy.qa', website: 'https://www.qatarenergy.qa',
    hqCity: 'Doha', isActive: true,
  },
  {
    id: 'co-2', publicId: 'pub-co-2', tenantId: TENANT,
    name: 'Nakilat', type: 'Owner',
    countryId: 'c-qa', email: 'info@nakilat.com', website: 'https://www.nakilat.com',
    hqCity: 'Doha', isActive: true,
  },
  {
    id: 'co-3', publicId: 'pub-co-3', tenantId: TENANT,
    name: 'Shell LNG', type: 'Operator',
    countryId: 'c-nl', email: 'info@shell.com', website: 'https://www.shell.com',
    hqCity: 'The Hague', isActive: true,
  },
  {
    id: 'co-4', publicId: 'pub-co-4', tenantId: TENANT,
    name: 'TotalEnergies', type: 'Owner',
    countryId: 'c-gb', email: 'info@totalenergies.com', website: 'https://www.totalenergies.com',
    hqCity: 'London', isActive: true,
  },
  {
    id: 'co-5', publicId: 'pub-co-5', tenantId: TENANT,
    name: 'GasLog Ltd', type: 'Owner',
    countryId: 'c-gb', email: 'info@gaslog.com', website: 'https://www.gaslog.com',
    hqCity: 'London', isActive: true,
  },
  {
    id: 'co-6', publicId: 'pub-co-6', tenantId: TENANT,
    name: 'Lloyd\'s Register', type: 'Authority',
    countryId: 'c-gb', email: 'info@lr.org', website: 'https://www.lr.org',
    hqCity: 'London', isActive: true, iacsMember: true,
  },
]);

const terminals = makeStore([
  {
    id: 't-1', publicId: 'pub-t-1', tenantId: TENANT,
    name: 'Ras Laffan LNG Terminal',
    port: 'Ras Laffan Industrial City',
    countryId: 'c-qa', legacyCountryName: 'Qatar',
    latitude: 25.9213, longitude: 51.5456,
    status: 'Operational', operation_type: 'Export',
    operator: 'QatarEnergy LNG',
    capacity_mtpa: 77, storage_capacity: 810000, number_of_tanks: 18,
    timezone: 'Asia/Qatar',
    pilotage_required: true, tugs_available: true,
    isActive: true, isArchived: false,
    created_date: '2024-01-10T08:00:00Z',
  },
  {
    id: 't-2', publicId: 'pub-t-2', tenantId: TENANT,
    name: 'Sabine Pass LNG Terminal',
    port: 'Sabine Pass',
    countryId: 'c-us', legacyCountryName: 'United States',
    latitude: 29.7355, longitude: -93.8705,
    status: 'Operational', operation_type: 'Export',
    operator: 'Cheniere Energy',
    capacity_mtpa: 30, storage_capacity: 540000, number_of_tanks: 9,
    timezone: 'America/Chicago',
    pilotage_required: true, tugs_available: true,
    isActive: true, isArchived: false,
    created_date: '2024-01-12T08:00:00Z',
  },
  {
    id: 't-3', publicId: 'pub-t-3', tenantId: TENANT,
    name: 'Gate Terminal Rotterdam',
    port: 'Rotterdam',
    countryId: 'c-nl', legacyCountryName: 'Netherlands',
    latitude: 51.9497, longitude: 4.1428,
    status: 'Operational', operation_type: 'Import',
    operator: 'Gate Terminal BV',
    capacity_mtpa: 12, storage_capacity: 540000, number_of_tanks: 9,
    timezone: 'Europe/Amsterdam',
    pilotage_required: true, tugs_available: true,
    isActive: true, isArchived: false,
    created_date: '2024-01-15T08:00:00Z',
  },
  {
    id: 't-4', publicId: 'pub-t-4', tenantId: TENANT,
    name: 'South Hook LNG Terminal',
    port: 'Milford Haven',
    countryId: 'c-gb', legacyCountryName: 'United Kingdom',
    latitude: 51.7070, longitude: -5.0490,
    status: 'Operational', operation_type: 'Import',
    operator: 'South Hook LNG',
    capacity_mtpa: 21, storage_capacity: 775000, number_of_tanks: 5,
    timezone: 'Europe/London',
    pilotage_required: true, tugs_available: true,
    isActive: true, isArchived: false,
    created_date: '2024-02-01T08:00:00Z',
  },
  {
    id: 't-5', publicId: 'pub-t-5', tenantId: TENANT,
    name: 'Barcelona LNG Terminal',
    port: 'Barcelona',
    countryId: 'c-es', legacyCountryName: 'Spain',
    latitude: 41.3297, longitude: 2.1889,
    status: 'Operational', operation_type: 'Import',
    operator: 'Enagás',
    capacity_mtpa: 11.8, storage_capacity: 760000, number_of_tanks: 8,
    timezone: 'Europe/Madrid',
    pilotage_required: true, tugs_available: true,
    isActive: true, isArchived: false,
    created_date: '2024-02-10T08:00:00Z',
  },
]);

const vessels = makeStore([
  {
    id: 'v-1', publicId: 'pub-v-1', tenantId: TENANT,
    name: 'Mozah',
    imoNumber: '9337119', mmsi: '466020000', callSign: 'A7MZ',
    vesselInternalId: 'VSL-000001',
    ownerCompanyId: 'co-2',
    flagCountryId: 'c-qa',
    yearBuilt: 2008, shipyard: 'Samsung Heavy Industries',
    classSocietyCompanyId: 'co-6', classNotation: '+1A LNGC',
    loa_m: 345, beam_m: 53.8, maxDraft_m: 12.35,
    gt: 141000, dwt: 129650,
    cargoContainmentType: 'Membrane GTT Mark III',
    cargoCapacity_m3: 266000,
    manifoldLngCount: 3, manifoldVapourCount: 1,
    berthingSideSupported: 'Both',
    status: 'Active', isActive: true,
    created_date: '2024-01-10T08:00:00Z',
  },
  {
    id: 'v-2', publicId: 'pub-v-2', tenantId: TENANT,
    name: 'Al Samriya',
    imoNumber: '9337121', mmsi: '466021000', callSign: 'A7MS',
    vesselInternalId: 'VSL-000002',
    ownerCompanyId: 'co-2',
    flagCountryId: 'c-qa',
    yearBuilt: 2009, shipyard: 'Hyundai Heavy Industries',
    classSocietyCompanyId: 'co-6', classNotation: '+1A LNGC',
    loa_m: 315, beam_m: 50.0, maxDraft_m: 12.0,
    gt: 103000, dwt: 93000,
    cargoContainmentType: 'Membrane GTT Mark III',
    cargoCapacity_m3: 210000,
    manifoldLngCount: 3, manifoldVapourCount: 1,
    berthingSideSupported: 'Both',
    status: 'Active', isActive: true,
    created_date: '2024-01-12T08:00:00Z',
  },
  {
    id: 'v-3', publicId: 'pub-v-3', tenantId: TENANT,
    name: 'BW Everett',
    imoNumber: '9516930', mmsi: '563091300', callSign: '9V6553',
    vesselInternalId: 'VSL-000003',
    ownerCompanyId: 'co-5',
    flagCountryId: 'c-gb',
    yearBuilt: 2013, shipyard: 'DSME',
    classSocietyCompanyId: 'co-6', classNotation: '+1A LNGC',
    loa_m: 291, beam_m: 46.0, maxDraft_m: 11.5,
    gt: 87000, dwt: 77500,
    cargoContainmentType: 'Membrane GTT Mark III',
    cargoCapacity_m3: 162400,
    manifoldLngCount: 3, manifoldVapourCount: 1,
    berthingSideSupported: 'Both',
    status: 'Active', isActive: true,
    created_date: '2024-01-15T08:00:00Z',
  },
  {
    id: 'v-4', publicId: 'pub-v-4', tenantId: TENANT,
    name: 'GasLog Athens',
    imoNumber: '9585529', mmsi: '241419000', callSign: 'SVCE8',
    vesselInternalId: 'VSL-000004',
    ownerCompanyId: 'co-5',
    flagCountryId: 'c-gb',
    yearBuilt: 2013, shipyard: 'Samsung Heavy Industries',
    classSocietyCompanyId: 'co-6', classNotation: '+1A LNGC',
    loa_m: 285, beam_m: 43.4, maxDraft_m: 11.4,
    gt: 97600, dwt: 79300,
    cargoContainmentType: 'Membrane GTT Mark III',
    cargoCapacity_m3: 155000,
    manifoldLngCount: 3, manifoldVapourCount: 1,
    berthingSideSupported: 'Both',
    status: 'Active', isActive: true,
    created_date: '2024-02-01T08:00:00Z',
  },
  {
    id: 'v-5', publicId: 'pub-v-5', tenantId: TENANT,
    name: 'Golar Tundra',
    imoNumber: '9702580', mmsi: '538007754', callSign: 'V7WQ4',
    vesselInternalId: 'VSL-000005',
    ownerCompanyId: 'co-3',
    flagCountryId: 'c-gb',
    yearBuilt: 2015, shipyard: 'Hyundai Heavy Industries',
    classSocietyCompanyId: 'co-6', classNotation: '+1A LNGC',
    loa_m: 295, beam_m: 46.0, maxDraft_m: 11.9,
    gt: 99000, dwt: 82000,
    cargoContainmentType: 'Membrane GTT Mark III',
    cargoCapacity_m3: 170000,
    manifoldLngCount: 3, manifoldVapourCount: 1,
    berthingSideSupported: 'Both',
    status: 'Laid Up', isActive: true,
    created_date: '2024-02-10T08:00:00Z',
  },
]);

const berths = makeStore([
  {
    id: 'b-1', publicId: 'pub-b-1', tenantId: TENANT,
    terminalPublicId: 'pub-t-1',
    berth_number: 'Berth 1', berthCode: 'RL-LNG1',
    berthName: 'Ras Laffan LNG Berth 1',
    berthType: 'Jetty', operator: 'QatarEnergy LNG',
    max_loa: 345, max_beam: 53.8, max_draft: 12.35,
    min_cargo_capacity: 135000, max_cargo_capacity: 266000,
    maxLOAM: 345, maxBeamM: 53.8, maxArrivalDraftM: 12.35,
    loadingArmsLngCount: 3, vapourReturnAvailable: true,
    manifold_height_min: 5.0, manifold_height_max: 16.0,
    qmaxCapable: true, qflexCapable: true,
    loading_arms: 3, fenders_type: 'Cone', bollards_capacity: 150,
    status: 'Active', isArchived: false,
    created_date: '2024-01-10T08:00:00Z',
  },
  {
    id: 'b-2', publicId: 'pub-b-2', tenantId: TENANT,
    terminalPublicId: 'pub-t-1',
    berth_number: 'Berth 2', berthCode: 'RL-LNG2',
    berthName: 'Ras Laffan LNG Berth 2',
    berthType: 'Jetty', operator: 'QatarEnergy LNG',
    max_loa: 345, max_beam: 53.8, max_draft: 12.35,
    min_cargo_capacity: 135000, max_cargo_capacity: 266000,
    maxLOAM: 345, maxBeamM: 53.8, maxArrivalDraftM: 12.35,
    loadingArmsLngCount: 3, vapourReturnAvailable: true,
    manifold_height_min: 5.0, manifold_height_max: 16.0,
    qmaxCapable: true, qflexCapable: true,
    loading_arms: 3, fenders_type: 'Cone', bollards_capacity: 150,
    status: 'Active', isArchived: false,
    created_date: '2024-01-10T08:00:00Z',
  },
  {
    id: 'b-3', publicId: 'pub-b-3', tenantId: TENANT,
    terminalPublicId: 'pub-t-2',
    berth_number: 'Berth 1', berthCode: 'SP-1',
    berthName: 'Sabine Pass Berth 1',
    berthType: 'Jetty', operator: 'Cheniere Energy',
    max_loa: 345, max_beam: 55.0, max_draft: 12.5,
    min_cargo_capacity: 100000, max_cargo_capacity: 266000,
    maxLOAM: 345, maxBeamM: 55.0, maxArrivalDraftM: 12.5,
    loadingArmsLngCount: 3, vapourReturnAvailable: true,
    manifold_height_min: 4.5, manifold_height_max: 17.0,
    qmaxCapable: true, qflexCapable: true,
    loading_arms: 3, fenders_type: 'Cell', bollards_capacity: 200,
    status: 'Active', isArchived: false,
    created_date: '2024-01-12T08:00:00Z',
  },
  {
    id: 'b-4', publicId: 'pub-b-4', tenantId: TENANT,
    terminalPublicId: 'pub-t-3',
    berth_number: 'Berth 1', berthCode: 'GATE-1',
    berthName: 'Gate Terminal Berth 1',
    berthType: 'Jetty', operator: 'Gate Terminal BV',
    max_loa: 345, max_beam: 54.0, max_draft: 12.5,
    min_cargo_capacity: 125000, max_cargo_capacity: 266000,
    maxLOAM: 345, maxBeamM: 54.0, maxArrivalDraftM: 12.5,
    loadingArmsLngCount: 3, vapourReturnAvailable: true,
    manifold_height_min: 5.0, manifold_height_max: 16.5,
    qmaxCapable: true, qflexCapable: true,
    loading_arms: 3, fenders_type: 'Cone', bollards_capacity: 180,
    status: 'Active', isArchived: false,
    created_date: '2024-01-15T08:00:00Z',
  },
]);

const documents = makeStore([
  {
    id: 'd-1', publicId: 'pub-d-1', tenantId: TENANT,
    vessel_id: 'v-1', vesselPublicId: 'pub-v-1',
    document_name: 'Certificate of Registry — Mozah',
    status: 'Valid', isActive: true,
    issue_date: '2023-01-15', expiry_date: '2028-01-14',
    reference_number: 'QAT-CR-2023-001',
    created_date: '2024-01-10T08:00:00Z',
  },
  {
    id: 'd-2', publicId: 'pub-d-2', tenantId: TENANT,
    vessel_id: 'v-1', vesselPublicId: 'pub-v-1',
    document_name: 'International Tonnage Certificate — Mozah',
    status: 'Valid', isActive: true,
    issue_date: '2022-06-01', expiry_date: '2027-05-31',
    reference_number: 'ITC-2022-QAT-001',
    created_date: '2024-01-10T08:00:00Z',
  },
  {
    id: 'd-3', publicId: 'pub-d-3', tenantId: TENANT,
    vessel_id: 'v-2', vesselPublicId: 'pub-v-2',
    document_name: 'Safety Management Certificate — Al Samriya',
    status: 'Valid', isActive: true,
    issue_date: '2023-03-10', expiry_date: '2026-03-09',
    reference_number: 'SMC-2023-QAT-002',
    created_date: '2024-01-12T08:00:00Z',
  },
  {
    id: 'd-4', publicId: 'pub-d-4', tenantId: TENANT,
    vessel_id: 'v-3', vesselPublicId: 'pub-v-3',
    document_name: 'SIRE Inspection Report — BW Everett',
    status: 'Expiring Soon', isActive: true,
    issue_date: '2023-09-20', expiry_date: '2024-09-19',
    reference_number: 'SIRE-2023-BW-001',
    created_date: '2024-01-15T08:00:00Z',
  },
  {
    id: 'd-5', publicId: 'pub-d-5', tenantId: TENANT,
    vessel_id: 'v-4', vesselPublicId: 'pub-v-4',
    document_name: 'International Oil Pollution Prevention Certificate — GasLog Athens',
    status: 'Valid', isActive: true,
    issue_date: '2022-11-05', expiry_date: '2027-11-04',
    reference_number: 'IOPP-2022-GL-001',
    created_date: '2024-02-01T08:00:00Z',
  },
]);

// ---------------------------------------------------------------------------
// Mock user
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: 'mock-user-1',
  publicId: 'mock-user-public-1',
  email: 'dev@example.com',
  full_name: 'Dev User',
  username: 'devuser',
  role: 'admin',
  favoriteTerminalIds: [],
  favoriteComplexIds: [],
  favoriteBerthIds: [],
};

// ---------------------------------------------------------------------------
// Generic no-op proxy for entities without seed data
// ---------------------------------------------------------------------------

const genericEntityHandler = {
  get(_, _entityName) {
    return {
      list:       () => Promise.resolve([]),
      filter:     () => Promise.resolve([]),
      create:     (data) => Promise.resolve({ id: genId(), ...data }),
      update:     noop,
      delete:     noop,
      bulkCreate: (items) => Promise.resolve(items.map(d => ({ id: genId(), ...d }))),
    };
  },
};

// ---------------------------------------------------------------------------
// API-backed read stores (replace seed data with live backend calls)
// ---------------------------------------------------------------------------

function makeApiStore(endpoint) {
  return {
    async list(sortBy, limit) {
      const res = await fetch(`http://localhost:5254${endpoint}`);
      let rows = await res.json();
      rows = applySort(rows, sortBy);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async filter(query, sortBy, limit) {
      const res = await fetch(`http://localhost:5254${endpoint}`);
      let rows = await res.json();
      rows = applyFilter(rows, query);
      rows = applySort(rows, sortBy);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async create(data) {
      const res = await fetch(`http://localhost:5254${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      try { return await res.json(); } catch { return {}; }
    },
    async update(id, data) {
      const res = await fetch(`http://localhost:5254${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      try { return await res.json(); } catch { return {}; }
    },
    delete:     noop,
    bulkCreate: (items) => Promise.resolve(items.map(d => ({ id: genId(), ...d }))),
  };
}

/**
 * Same as makeApiStore but with a real DELETE /{id} endpoint wired.
 * Used for entities that have full CRUD on the backend.
 */
function makeApiStoreFull(endpoint) {
  const base = makeApiStore(endpoint);
  return {
    ...base,
    async delete(id) {
      const res = await fetch(`http://localhost:5254${endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new Error(await res.text());
    },
  };
}

// ---------------------------------------------------------------------------
// Named entity stores (override the generic proxy for key entities)
// ---------------------------------------------------------------------------

const namedStores = {
  // In-memory seed stores (write-capable for this session)
  Vessel:    makeApiStoreFull('/api/vessels'),
  Document:  makeApiStoreFull('/api/documents'),

  // API-backed stores — Phase 2 CRM
  Company:   makeApiStoreFull('/api/companies'),
  Contact:   makeApiStoreFull('/api/contacts'),

  CompanySystemTagAssignment: {
    async list() {
      const res = await fetch('http://localhost:5254/api/company-system-tag-assignments');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async filter(query = {}) {
      const params = new URLSearchParams();
      if (query.companyId !== undefined) params.set('companyId', query.companyId);
      const url = `http://localhost:5254/api/company-system-tag-assignments${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async create(data) {
      const res = await fetch('http://localhost:5254/api/company-system-tag-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async bulkCreate(items) {
      const res = await fetch('http://localhost:5254/api/company-system-tag-assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async delete(id) {
      const res = await fetch(`http://localhost:5254/api/company-system-tag-assignments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new Error(await res.text());
    },
  },

  SystemTagAssignment: {
    async list() {
      const res = await fetch('http://localhost:5254/api/system-tag-assignments');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async filter(query = {}) {
      const params = new URLSearchParams();
      if (query.contactId !== undefined) params.set('contactId', query.contactId);
      const url = `http://localhost:5254/api/system-tag-assignments${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async create(data) {
      const res = await fetch('http://localhost:5254/api/system-tag-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async bulkCreate(items) {
      const res = await fetch('http://localhost:5254/api/system-tag-assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async delete(id) {
      const res = await fetch(`http://localhost:5254/api/system-tag-assignments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new Error(await res.text());
    },
  },

  // API-backed stores — Phase 1 reference data
  Country:             countries,
  CountryAlias:        makeApiStore('/api/country-aliases'),
  IssuingAuthority:    makeApiStoreFull('/api/issuing-authorities'),
  SystemTag:           makeApiStoreFull('/api/system-tags'),
  DocumentType:        makeApiStore('/api/document-types'),
  DocumentCategory:         makeApiStore('/api/document-categories'),
  DocumentTypeExternalCode: makeApiStore('/api/document-type-external-codes'),
  ProductTypeRef:      makeApiStore('/api/product-types'),
  FuelTypeRef:         makeApiStoreFull('/api/fuel-types'),
  CargoTypeRef:        makeApiStoreFull('/api/cargo-types'),
  VesselTypeRef:       makeApiStoreFull('/api/vessel-types'),
  MaritimeZone:        makeApiStoreFull('/api/maritime-zones'),
  UdfConfiguration:    makeApiStore('/api/udf-configurations'),
  UdfListValue:        makeApiStore('/api/udf-list-values'),
  TerminalType:        makeApiStore('/api/terminal-types'),

  // API-backed stores — Phase 3 terminals & berths
  TerminalComplex:     makeApiStoreFull('/api/terminal-complexes'),
  Terminal:            makeApiStore('/api/terminals'),
  Berth:               makeApiStore('/api/berths'),

  // API-backed stores — Phase 3 document requirements
  // Custom store: frontend filters by { terminalId } which maps to terminalPublicId on the backend
  TerminalDocumentRequirement: {
    async list() {
      const res = await fetch('http://localhost:5254/api/terminal-document-requirements');
      return res.json();
    },
    async filter(query = {}) {
      const params = new URLSearchParams();
      if (query.terminalId)   params.set('terminalPublicId', query.terminalId);
      if (query.berthId)      params.set('berthPublicId', query.berthId);
      const url = `http://localhost:5254/api/terminal-document-requirements${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      let rows = await res.json();
      // Apply any remaining client-side filters not handled by query params
      const remaining = Object.fromEntries(
        Object.entries(query).filter(([k]) => k !== 'terminalId' && k !== 'berthId')
      );
      return applyFilter(rows, remaining);
    },
    async create(data) {
      const res = await fetch('http://localhost:5254/api/terminal-document-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      try { return await res.json(); } catch { return {}; }
    },
    async update(id, data) {
      const res = await fetch(`http://localhost:5254/api/terminal-document-requirements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      try { return await res.json(); } catch { return {}; }
    },
    async bulkCreate(items) {
      const results = [];
      for (const item of items) {
        const res = await fetch('http://localhost:5254/api/terminal-document-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error(await res.text());
        try { results.push(await res.json()); } catch { results.push({}); }
      }
      return results;
    },
    async delete(id) {
      const res = await fetch(`http://localhost:5254/api/terminal-document-requirements/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new Error(await res.text());
    },
  },
};

const entityProxy = new Proxy({}, {
  get(_, entityName) {
    return namedStores[entityName] ?? new Proxy({}, genericEntityHandler).Terminal;
  },
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const base44 = {
  entities: entityProxy,

  auth: {
    me:              () => Promise.resolve(MOCK_USER),
    logout:          noop,
    redirectToLogin: noop,
    isAuthenticated: () => Promise.resolve(true),
    updateMe:        (data) => {
      Object.assign(MOCK_USER, data);
      return Promise.resolve(MOCK_USER);
    },
  },

  appLogs: {
    logUserInApp: noop,
  },

  integrations: {
    Core: {
      // File storage not yet implemented. Returns null file_url so document records
      // still save. Replace with real upload endpoint when storage is ready.
      UploadFile: () => Promise.resolve({ file_url: null }),
    },
  },
};
