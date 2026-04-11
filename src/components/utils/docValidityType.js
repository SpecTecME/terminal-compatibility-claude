/**
 * Human-readable labels for DocumentType.documentValidityType enum values.
 * Use formatDocValidityType() wherever validity type is displayed in the UI.
 */
export const DOC_VALIDITY_LABELS = {
  PermanentStatic:       'Permanent Static',
  TerminalEventDriven:   'Terminal Event Driven',
  RenewableCertified:    'Renewable Certified',
  VettingTimeSensitive:  'Vetting Time Sensitive',
};

export function formatDocValidityType(type) {
  return DOC_VALIDITY_LABELS[type] || type || '-';
}
