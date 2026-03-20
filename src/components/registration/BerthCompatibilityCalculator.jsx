/**
 * Berth Compatibility Calculator
 * Evaluates vessel against berth constraints and generates human-readable reasons
 */

export function calculateBerthCompatibility(vessel, berth) {
  const restrictions = [];
  const incompatibilities = [];

  // LOA Check
  if (berth.maxLOAM && vessel.loa_m) {
    if (vessel.loa_m > berth.maxLOAM) {
      incompatibilities.push(`LOA ${vessel.loa_m}m exceeds berth limit ${berth.maxLOAM}m`);
    } else if (vessel.loa_m > berth.maxLOAM * 0.95) {
      restrictions.push(`LOA ${vessel.loa_m}m close to limit ${berth.maxLOAM}m - tight fit`);
    }
  }

  // Beam Check
  if (berth.maxBeamM && vessel.beam_m) {
    if (vessel.beam_m > berth.maxBeamM) {
      incompatibilities.push(`Beam ${vessel.beam_m}m exceeds berth limit ${berth.maxBeamM}m`);
    }
  }

  // Draft Check
  if (berth.maxArrivalDraftM && vessel.draft_m) {
    if (vessel.draft_m > berth.maxArrivalDraftM) {
      incompatibilities.push(`Draft ${vessel.draft_m}m exceeds berth limit ${berth.maxArrivalDraftM}m`);
    } else if (vessel.draft_m > berth.maxArrivalDraftM * 0.9) {
      restrictions.push(`Draft ${vessel.draft_m}m leaves minimal under-keel clearance`);
    }
  }

  // Cargo Capacity Check
  if (berth.maxCargoCapacityM3 && vessel.cargoCapacity_m3) {
    if (vessel.cargoCapacity_m3 > berth.maxCargoCapacityM3) {
      restrictions.push(`Cargo capacity ${vessel.cargoCapacity_m3}m³ exceeds berth design ${berth.maxCargoCapacityM3}m³`);
    }
  }

  // Manifold Height Check
  if (berth.manifold_height_min && berth.manifold_height_max && vessel.manifold_height_m) {
    if (vessel.manifold_height_m < berth.manifold_height_min || vessel.manifold_height_m > berth.manifold_height_max) {
      restrictions.push(`Manifold height ${vessel.manifold_height_m}m outside berth range ${berth.manifold_height_min}-${berth.manifold_height_max}m`);
    }
  }

  // Determine overall status
  let compatibilityStatus;
  if (incompatibilities.length > 0) {
    compatibilityStatus = 'NOT_COMPATIBLE';
  } else if (restrictions.length > 0) {
    compatibilityStatus = 'COMPATIBLE_WITH_RESTRICTIONS';
  } else {
    compatibilityStatus = 'COMPATIBLE';
  }

  return {
    compatibilityStatus,
    restrictions,
    incompatibilityReasons: incompatibilities
  };
}

/**
 * Calculate compatibility for all berths at a terminal
 */
export async function calculateTerminalBerthCompatibilities(registrationId, vesselId, terminalId, base44) {
  const vessel = await base44.entities.Vessel.filter({ id: vesselId }).then(r => r[0]);
  const berths = await base44.entities.Berth.filter({ terminal_id: terminalId, isArchived: false });
  
  const results = [];
  
  for (const berth of berths) {
    const compatibility = calculateBerthCompatibility(vessel, berth);
    
    // Check if record already exists
    const existing = await base44.entities.VesselBerthCompatibility.filter({
      registrationId,
      berthId: berth.id
    });

    const data = {
      publicId: existing[0]?.publicId || crypto.randomUUID(),
      tenantId: vessel.tenantId,
      registrationId,
      registrationPublicId: null, // Will be set by caller
      vesselId: vessel.id,
      vesselPublicId: vessel.publicId,
      berthId: berth.id,
      berthPublicId: berth.publicId,
      ...compatibility,
      computedAt: new Date().toISOString()
    };

    if (existing[0]) {
      await base44.entities.VesselBerthCompatibility.update(existing[0].id, data);
      results.push({ ...existing[0], ...data });
    } else {
      const created = await base44.entities.VesselBerthCompatibility.create(data);
      results.push(created);
    }
  }
  
  return results;
}