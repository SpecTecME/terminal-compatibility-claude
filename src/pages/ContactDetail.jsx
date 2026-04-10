/**
 * Contact Detail Page
 * 
 * PURPOSE:
 * Comprehensive view of individual contact with support for both persons and group emails.
 * Displays professional details, employment history, and critical role assignments.
 * 
 * DUAL CONTACT TYPES:
 * 
 * INDIVIDUAL PERSON (isGroupEmail = false):
 * - firstName, lastName, preferredName
 * - Personal contact methods (mobile, email, WhatsApp)
 * - Job title and department
 * - Example: "John Smith, Terminal Manager"
 * 
 * GROUP EMAIL (isGroupEmail = true):
 * - groupName (e.g., "Operations Team", "Safety Department")
 * - Shared mailbox or distribution list
 * - No personal identifiers
 * - Example: "operations@terminal.com"
 * 
 * Display Name Logic (lines 62-64):
 * Conditionally shows groupName OR "firstName lastName".
 * Clean presentation regardless of type.
 * 
 * CRITICAL ROLE SYSTEM (lines 66-69, 89-97):
 * 
 * criticalRole enum: None / Security / Safety
 * 
 * PURPOSE:
 * Identifies contacts with special emergency/compliance responsibilities.
 * 
 * Security Role:
 * - Access control decisions
 * - Security incident response
 * - Red badge with Shield icon
 * - Example: "Port Security Officer"
 * 
 * Safety Role:
 * - Safety compliance contacts
 * - Emergency response coordination
 * - Amber badge with AlertTriangle icon
 * - Example: "HSE Manager"
 * 
 * USE CASE:
 * Emergency incident → System highlights contacts with criticalRole = Security/Safety
 * Quick identification of key personnel.
 * 
 * EMPLOYMENT HISTORY (lines 44-48, 231-254):
 * 
 * ContactEmploymentHistory entity:
 * - Tracks contact's previous positions
 * - Each record: company, position, department, dates
 * - Useful for relationship context
 * 
 * EXAMPLE:
 * Contact currently at Company A, previously at Company B.
 * Historical relationship valuable for business development.
 * 
 * Date Range Display:
 * - startDate to endDate (if ended)
 * - startDate to "Present" (if no endDate)
 * - "Unknown" if no startDate
 * 
 * SYSTEM TAGS (lines 33-42, 60, 193-211):
 * 
 * Machine-readable contact classifications.
 * Examples: "Vessel Master", "Port Captain", "DPA"
 * 
 * SystemTagAssignment entity links contacts to tags.
 * Enables filtering: "Show all DPAs" or "Find all Port Captains"
 * 
 * Display:
 * - Purple badges for system tags (official classifications)
 * - Contrasts with user tags (personal organization)
 * 
 * USER TAGS (lines 213-220):
 * 
 * Personal tags applied by current user only.
 * Not visible to other users.
 * Managed by UserTagManager component.
 * Supports personal CRM workflows.
 * 
 * COMPANY LINKAGE (lines 23-26, 58, 159-168):
 * 
 * Contact belongs to one company (companyId).
 * Displays company name with clickable link.
 * Enables quick navigation to employer details.
 * 
 * COUNTRY AUTO-POPULATION:
 * When contact's company has countryId, that's often contact's country too.
 * See AddContact for auto-population logic.
 * Here we just display the relationship.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Edit, Mail, Phone, Building2, MapPin, Shield, AlertTriangle, Tag as TagIcon } from 'lucide-react';
import UserTagManager from '../components/tags/UserTagManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ContactDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const contactId = urlParams.get('id');

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => base44.entities.Contact.filter({ id: contactId }).then(r => r[0]),
    enabled: !!contactId
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['contactSystemTagAssignments', contactId],
    queryFn: () => base44.entities.SystemTagAssignment.filter({ contactId }),
    enabled: !!contactId
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: employmentHistory = [] } = useQuery({
    queryKey: ['employmentHistory', contactId],
    queryFn: () => base44.entities.ContactEmploymentHistory.filter({ contactId }),
    enabled: !!contactId
  });

  if (isLoading || !contact) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const company = companies.find(c => c.id === contact.companyId);
  const country = countries.find(c => c.id === contact.countryId);
  const contactTags = tagAssignments.map(a => tags.find(t => t.id === a.systemTagId)).filter(Boolean);
  
  const displayName = contact.isGroupEmail 
    ? contact.groupName
    : [contact.firstName, contact.lastName].filter(Boolean).join(' ');

  const criticalRoleConfig = {
    Security: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    Safety: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {contact.isGroupEmail && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border">
                  <Mail className="w-3 h-3 mr-1" />
                  Group Email
                </Badge>
              )}
              {contact.criticalRole && contact.criticalRole !== 'None' && (() => {
                const RoleIcon = criticalRoleConfig[contact.criticalRole].icon;
                return (
                  <Badge className={`${criticalRoleConfig[contact.criticalRole].bg} ${criticalRoleConfig[contact.criticalRole].color} border ${criticalRoleConfig[contact.criticalRole].border}`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {contact.criticalRole}
                  </Badge>
                );
              })()}
              <Badge className={contact.isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
              }>
                {contact.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <Link to={createPageUrl(`EditContact?id=${contactId}`)}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {contact.email && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${contact.email}`} className="text-cyan-600 hover:text-cyan-700">
                    {contact.email}
                  </a>
                </div>
              </div>
            )}
            {contact.phoneMobile && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Mobile</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900">{contact.phoneMobile}</p>
                </div>
              </div>
            )}
            {contact.phoneOffice && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Office Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900">{contact.phoneOffice}</p>
                </div>
              </div>
            )}
            {contact.whatsapp && (
              <div>
                <p className="text-sm text-gray-600 mb-1">WhatsApp</p>
                <p className="text-gray-900">{contact.whatsapp}</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {company && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Company</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <Link to={createPageUrl(`CompanyDetail?id=${company.id}`)}>
                    <p className="text-cyan-600 hover:text-cyan-700 font-medium">{company.name}</p>
                  </Link>
                </div>
              </div>
            )}
            {country && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Country</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900">{country.nameEn}</p>
                </div>
              </div>
            )}
            {contact.jobTitle && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Job Title</p>
                <p className="text-gray-900">{contact.jobTitle}</p>
              </div>
            )}
            {contact.department && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Department</p>
                <p className="text-gray-900">{contact.department}</p>
              </div>
            )}
          </div>

          {contactTags.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">System Tags</p>
            <div className="flex flex-wrap gap-2">
              {contactTags.map(tag => (
                <Badge 
                  key={tag.id}
                  className={tag.isSystem 
                    ? 'bg-purple-500/10 text-purple-600 border-purple-500/30 border'
                    : 'bg-gray-100 text-gray-700 border-gray-300 border'
                  }
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          )}

          <div>
          <p className="text-sm text-gray-600 mb-2">My Tags</p>
          <UserTagManager 
            entityType="contact" 
            entityId={contactId}
            entityPublicId={contact.publicId}
          />
          </div>

          {contact.notes && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {employmentHistory.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Employment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employmentHistory.map((job) => {
                const jobCompany = companies.find(c => c.id === job.companyId);
                return (
                  <div key={job.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="font-medium text-gray-900">{job.positionTitle}</p>
                    {jobCompany && <p className="text-sm text-gray-700">{jobCompany.name}</p>}
                    {job.department && <p className="text-sm text-gray-600">{job.department}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {job.startDate ? format(new Date(job.startDate), 'MMM yyyy') : 'Unknown'} - {job.endDate ? format(new Date(job.endDate), 'MMM yyyy') : 'Present'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}