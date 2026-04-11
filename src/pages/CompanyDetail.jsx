/**
 * Company Detail Page
 * 
 * PURPOSE:
 * Comprehensive view of company information with tabbed organization.
 * Central hub for managing company data, contacts, offices, legal entities, and documents.
 * 
 * COMPANY ARCHITECTURE - MULTI-ENTITY MODEL:
 * 
 * Company entity serves as PARENT for related child entities:
 * 
 * 1. COMPANY (Parent - This entity):
 *    - Core identity (name, type, country)
 *    - Contact information (phone, email, website)
 *    - Primary headquarters address
 *    - Main contact person linkage
 * 
 * 2. COMPANY OFFICES (Child entities):
 *    - Multiple physical locations (regional offices)
 *    - Each with own address, phone, timezone
 *    - One marked as HQ (isHQ flag)
 *    - Managed in CompanyOfficesTab component
 * 
 * 3. COMPANY LEGAL ENTITIES (Child entities):
 *    - Legal/corporate structure (subsidiaries, divisions)
 *    - Registration numbers, tax IDs
 *    - Legal and billing addresses
 *    - Important for invoicing and compliance
 *    - Managed in CompanyLegalEntitiesTab component
 * 
 * 4. COMPANY DOCUMENTS (Child entities):
 *    - Certificates, licenses, insurance policies
 *    - Company-level documentation
 *    - Managed in CompanyDocumentsTab component
 * 
 * 5. CONTACTS (Related entities):
 *    - Personnel working at this company
 *    - Filtered by companyId
 *    - Displayed in Contacts tab
 * 
 * RATIONALE FOR SEPARATION:
 * - Large multinational companies have many offices/entities
 * - Storing all in one record creates massive, unwieldy objects
 * - Separate entities enable independent CRUD operations
 * - Better data normalization and query performance
 * 
 * DUAL TAG SYSTEM:
 * 
 * SYSTEM TAGS (lines 37-41, 58):
 * - Machine-readable classifications
 * - Applied by system/admins (e.g., "IACS Member", "Port Authority")
 * - Used for filtering and regulatory compliance
 * - Stored in CompanySystemTagAssignment entity
 * - Displayed with purple badges (lines 221-235)
 * 
 * USER TAGS (lines 239-244):
 * - Personal organization tags
 * - User-specific (not shared)
 * - Examples: "Preferred Vendor", "Key Client"
 * - Managed via UserTagManager component
 * - Supports individual workflow customization
 * 
 * IACS MEMBER FIELD:
 * 
 * iacsMember (boolean):
 * - Only relevant for type = 'Authority'
 * - IACS = International Association of Classification Societies
 * - Members authorized to certify ships for international trade
 * - Critical for classification society validation
 * - Examples: DNV, Lloyd's Register, ABS, Bureau Veritas
 * 
 * MAIN CONTACT LINKAGE (lines 210-218):
 * 
 * mainContactId references a Contact record.
 * Provides quick access to primary relationship.
 * One-to-one relationship (not one-to-many).
 * 
 * USE CASE:
 * "Who do I call about this terminal operator?"
 * → Company.mainContactId → Contact details
 * 
 * CONTACTS TAB QUERY (lines 31-35):
 * Shows ALL contacts where Contact.companyId = this company.
 * One-to-many relationship (company has many contacts).
 * Main contact is one of these, highlighted if needed.
 * 
 * TABBED ORGANIZATION:
 * - Overview: Core company info, tags, main contact
 * - Offices: Physical locations (CompanyOfficesTab)
 * - Legal: Legal entities and registration (CompanyLegalEntitiesTab)
 * - Contacts: Personnel directory
 * - Documents: Company certifications (CompanyDocumentsTab)
 * 
 * Each tab is separate component for code organization.
 * Tabs load lazily (React default behavior).
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Edit, Building2, Globe, MapPin, Tag as TagIcon, Mail, Phone, Users } from 'lucide-react';
import UserTagManager from '../components/tags/UserTagManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanyOfficesTab from '../components/company/CompanyOfficesTab';
import CompanyLegalEntitiesTab from '../components/company/CompanyLegalEntitiesTab';
import CompanyDocumentsTab from '../components/company/CompanyDocumentsTab';

export default function CompanyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => base44.entities.Company.filter({ id: parseInt(companyId) }).then(r => r[0]),
    enabled: !!companyId
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', companyId],
    queryFn: () => base44.entities.Contact.filter({ companyId: parseInt(companyId) }),
    enabled: !!companyId
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['companySystemTagAssignments', companyId],
    queryFn: () => base44.entities.CompanySystemTagAssignment.filter({ companyId }),
    enabled: !!companyId
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  if (isLoading || !company) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const country = countries.find(c => c.id === (company.countryId || company.hqCountryId));
  const mainContact = contacts.find(c => c.id === company.mainContactId);
  const companyTags = tagAssignments.map(a => tags.find(t => t.id === a.systemTagId)).filter(Boolean);

  const typeColors = {
    'Operator': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    'Owner': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    'Authority': 'bg-red-500/10 text-red-600 border-red-500/30',
    'Agent': 'bg-green-500/10 text-green-600 border-green-500/30',
    'Service Provider': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    'Other': 'bg-gray-500/10 text-gray-600 border-gray-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {company.type && (
                <Badge className={`${typeColors[company.type]} border`}>
                  {company.type}
                </Badge>
              )}
              <Badge className={company.isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
              }>
                {company.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <Link to={createPageUrl(`EditCompany?id=${companyId}`)}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">
            <Building2 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="offices" className="data-[state=active]:bg-gray-100">
            <MapPin className="w-4 h-4 mr-2" />
            Offices
          </TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-gray-100">
            Legal Entities
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-gray-100">
            <Users className="w-4 h-4 mr-2" />
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-gray-100">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company Name</p>
                  <p className="text-gray-900 font-medium">{company.name}</p>
                </div>
                {company.legalName && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Legal Name</p>
                    <p className="text-gray-900 font-medium">{company.legalName}</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {company.type && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Primary Role</p>
                    <p className="text-gray-900 font-medium">{company.type === 'Other' ? 'Other / Unclassified' : company.type}</p>
                  </div>
                )}
                {company.type === 'Authority' && company.iacsMember && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">IACS Member</p>
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border">
                      Yes
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {country && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Country</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900">{country.nameEn}</p>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Website</p>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700"
                    >
                      <Globe className="w-4 h-4" />
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              {(company.phone || company.email) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {company.phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-gray-900">{company.phone}</p>
                      </div>
                    </div>
                  )}
                  {company.email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <p className="text-gray-900">{company.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mainContact && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Main Contact</p>
                  <Link to={createPageUrl(`ContactDetail?id=${mainContact.id}`)}>
                    <p className="text-cyan-600 hover:text-cyan-700 font-medium">
                      {mainContact.fullName || `${mainContact.firstName} ${mainContact.lastName}`.trim() || mainContact.groupName}
                    </p>
                  </Link>
                </div>
              )}

              {companyTags.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">System Tags (Functions)</p>
                  <div className="flex flex-wrap gap-2">
                    {companyTags.map(tag => (
                      <Badge 
                        key={tag.id}
                        className="bg-purple-500/10 text-purple-600 border-purple-500/30 border"
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">My Tags</p>
                <UserTagManager 
                  entityType="company" 
                  entityId={companyId}
                  entityPublicId={company.publicId}
                />
              </div>

              {company.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{company.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offices">
          <CompanyOfficesTab companyId={companyId} companyPublicId={company.publicId} />
        </TabsContent>

        <TabsContent value="legal">
          <CompanyLegalEntitiesTab companyId={companyId} companyPublicId={company.publicId} />
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No contacts found</p>
                  <p className="text-sm text-gray-500 mt-2">Add contacts linked to this company</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map(contact => (
                    <Link key={contact.id} to={createPageUrl(`ContactDetail?id=${contact.id}`)}>
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                        <p className="font-medium text-gray-900">
                          {contact.fullName || `${contact.firstName} ${contact.lastName}`.trim() || contact.groupName}
                        </p>
                        {contact.jobTitle && (
                          <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                        )}
                        {contact.email && (
                          <p className="text-sm text-gray-600">{contact.email}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <CompanyDocumentsTab companyId={companyId} companyPublicId={company.publicId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}