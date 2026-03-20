import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Ship, 
  Building2, 
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  FileText,
  Upload,
  Send,
  CheckCircle,
  Clock,
  RefreshCw,
  Anchor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '../components/ui/SearchableSelect';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { calculateTerminalBerthCompatibilities } from '../components/registration/BerthCompatibilityCalculator';
import UpdateDocumentDialog from '../components/registration/UpdateDocumentDialog';

async function evaluateRegistration(applicationId) {
  const app = await base44.entities.TerminalRegistrationApplication.filter({ id: applicationId }).then(r => r[0]);
  if (!app) throw new Error('Application not found');

  const today = new Date().toISOString().split('T')[0];
  
  const terminalReqs = await base44.entities.TerminalDocumentRequirement.filter({
    terminalId: app.terminalId,
    appliesLevel: 'Terminal',
    submissionStage: 'Registration',
    isActive: true
  });

  const allReqs = terminalReqs.filter(r => r.effectiveFrom && r.effectiveFrom <= today);
  const vesselDocs = await base44.entities.Document.filter({ vessel_id: app.vesselId });
  const docTypes = await base44.entities.DocumentType.list();
  const existingItems = await base44.entities.TerminalRegistrationChecklistItem.filter({ applicationId: app.id });

  for (const req of allReqs) {
    let existingItem = existingItems.find(i => i.requirementId === req.id);
    
    const docType = docTypes.find(dt => dt.id === req.documentTypeId);
    let evaluationStatus = 'MISSING';
    let matchedDocId = null;
    let matchedDocPublicId = null;

    if (req.documentTypeId) {
      const matchingDocs = vesselDocs.filter(d => d.documentTypeId === req.documentTypeId);
      if (matchingDocs.length > 0) {
        const sortedDocs = matchingDocs.sort((a, b) => 
          new Date(b.issue_date || 0) - new Date(a.issue_date || 0)
        );
        const latestDoc = sortedDocs[0];
        
        if (docType?.requiresExpiry && latestDoc.expiry_date) {
          if (latestDoc.expiry_date < today) {
            evaluationStatus = 'EXPIRED';
          } else {
            evaluationStatus = 'SATISFIED';
            matchedDocId = latestDoc.id;
            matchedDocPublicId = latestDoc.publicId;
          }
        } else {
          evaluationStatus = 'SATISFIED';
          matchedDocId = latestDoc.id;
          matchedDocPublicId = latestDoc.publicId;
        }
      }
    }

    const itemData = {
      publicId: existingItem?.publicId || crypto.randomUUID(),
      tenantId: app.tenantId,
      applicationId: app.id,
      applicationPublicId: app.publicId,
      requirementId: req.id,
      requirementPublicId: req.publicId,
      documentTypeId: req.documentTypeId,
      documentTypePublicId: req.documentTypePublicId,
      isMandatory: req.isMandatory,
      validFrom: req.effectiveFrom,
      evaluationStatus,
      matchedVesselDocumentId: matchedDocId,
      matchedVesselDocumentPublicId: matchedDocPublicId
    };

    if (existingItem) {
      await base44.entities.TerminalRegistrationChecklistItem.update(existingItem.id, itemData);
    } else {
      await base44.entities.TerminalRegistrationChecklistItem.create(itemData);
    }
  }

  await base44.entities.TerminalRegistrationApplication.update(app.id, {
    computedAt: new Date().toISOString()
  });
}

export default function ComplexRegistration() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedTerminalId = urlParams.get('terminalId');
  const preselectedVesselId = urlParams.get('vesselId');
  const existingApplicationId = urlParams.get('applicationId');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [terminalId, setTerminalId] = useState(preselectedTerminalId || '');
  const [vesselId, setVesselId] = useState(preselectedVesselId || '');
  const [applicationId, setApplicationId] = useState(existingApplicationId || null);
  const [updatingDocTypeId, setUpdatingDocTypeId] = useState(null);
  const [showDocumentUpdatedBanner, setShowDocumentUpdatedBanner] = useState(false);

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: application } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => base44.entities.TerminalRegistrationApplication.filter({ id: applicationId }).then(r => r[0]),
    enabled: !!applicationId,
    onSuccess: (app) => {
      if (app && app.documentApprovalMode === 'SIMPLE') {
        navigate(createPageUrl(`SimpleRegistration?applicationId=${app.id}`));
      }
      if (app) {
        setTerminalId(app.terminalId);
        setVesselId(app.vesselId);
        if (app.status === 'APPROVED') {
          setStep(3);
        } else if (app.status === 'DRAFT' || app.status === 'IN_PROGRESS' || app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'READY_TO_SUBMIT') {
          setStep(2);
        }
      }
    }
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklistItems', applicationId],
    queryFn: () => base44.entities.TerminalRegistrationChecklistItem.filter({ applicationId }),
    enabled: !!applicationId
  });

  const { data: docTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['berthCompatibilities', applicationId],
    queryFn: () => base44.entities.VesselBerthCompatibility.filter({ registrationId: applicationId }),
    enabled: !!applicationId && application?.status === 'APPROVED'
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths', terminalId],
    queryFn: () => base44.entities.Berth.filter({ terminal_id: terminalId }),
    enabled: !!terminalId && application?.status === 'APPROVED'
  });

  const { data: companySecurityPolicy } = useQuery({
    queryKey: ['companySecurityPolicy'],
    queryFn: () => base44.entities.CompanySecurityPolicy.list().then(r => r[0] || {}),
    staleTime: Infinity,
  });

  useEffect(() => {
    if ((preselectedTerminalId || preselectedVesselId) && !applicationId) {
      const findExistingApplication = async () => {
        const existingApp = await base44.entities.TerminalRegistrationApplication.filter({
          terminalId: preselectedTerminalId,
          vesselId: preselectedVesselId,
        });
        if (existingApp.length > 0) {
          setApplicationId(existingApp[0].id);
          setTerminalId(existingApp[0].terminalId);
          setVesselId(existingApp[0].vesselId);
          if (existingApp[0].documentApprovalMode === 'SIMPLE') {
            navigate(createPageUrl(`SimpleRegistration?applicationId=${existingApp[0].id}`));
          }
          if (existingApp[0].status === 'APPROVED') {
            setStep(3);
          } else if (existingApp[0].status === 'DRAFT' || existingApp[0].status === 'IN_PROGRESS' || existingApp[0].status === 'SUBMITTED' || existingApp[0].status === 'UNDER_REVIEW' || existingApp[0].status === 'READY_TO_SUBMIT') {
            setStep(2);
          }
        }
      };
      findExistingApplication();
    }
  }, [preselectedTerminalId, preselectedVesselId, applicationId, navigate]);

  const createAppMutation = useMutation({
    mutationFn: async (data) => {
      const terminal = terminals.find(t => t.id === data.terminalId);
      const vessel = vessels.find(v => v.id === data.vesselId);
      
      const existingApps = await base44.entities.TerminalRegistrationApplication.list();
      const maxNum = existingApps.reduce((max, app) => {
        const match = app.applicationNumber?.match(/REG-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const appNumber = `REG-${String(maxNum + 1).padStart(6, '0')}`;

      const newApp = await base44.entities.TerminalRegistrationApplication.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        applicationNumber: appNumber,
        terminalId: data.terminalId,
        terminalPublicId: terminal.publicId,
        vesselId: data.vesselId,
        vesselPublicId: vessel.publicId,
        status: 'IN_PROGRESS',
        documentApprovalMode: 'COMPLEX',
      });

      return newApp;
    },
    onSuccess: async (newApp) => {
      setApplicationId(newApp.id);
      await evaluateRegistration(newApp.id);
      queryClient.invalidateQueries(['checklistItems']);
      setStep(2);
      toast.success('Application created');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (appId) => {
      await base44.entities.TerminalRegistrationApplication.update(appId, {
        status: 'APPROVED',
        approvedAt: new Date().toISOString()
      });
      
      const app = await base44.entities.TerminalRegistrationApplication.filter({ id: appId }).then(r => r[0]);
      await calculateTerminalBerthCompatibilities(appId, app.vesselId, app.terminalId, base44);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['application', applicationId]);
      queryClient.invalidateQueries(['berthCompatibilities', applicationId]);
      toast.success('Registration approved - Berth compatibilities calculated');
      setStep(3);
    }
  });

  const handleNext = () => {
    if (step === 1) {
      if (!terminalId || !vesselId) {
        toast.error('Please select terminal and vessel');
        return;
      }
      createAppMutation.mutate({ terminalId, vesselId });
    } else if (step === 2) {
      if (missingMandatory > 0) {
        toast.error('Please satisfy all mandatory requirements');
        return;
      }
      approveMutation.mutate(applicationId);
    }
  };

  const terminal = terminals.find(t => t.id === terminalId);
  const vessel = vessels.find(v => v.id === vesselId);

  const missingMandatory = checklistItems.filter(i => i.isMandatory && i.evaluationStatus !== 'SATISFIED').length;
  const expiredCount = checklistItems.filter(i => i.evaluationStatus === 'EXPIRED').length;
  const satisfiedCount = checklistItems.filter(i => i.evaluationStatus === 'SATISFIED').length;

  const statusIcons = {
    SATISFIED: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    MISSING: <X className="w-4 h-4 text-red-400" />,
    EXPIRED: <Clock className="w-4 h-4 text-amber-400" />,
    NEEDS_REVIEW: <AlertCircle className="w-4 h-4 text-blue-400" />
  };

  const statusColors = {
    SATISFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    MISSING: 'bg-red-500/10 text-red-400 border-red-500/30',
    EXPIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    NEEDS_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  const compatibilityColors = {
    COMPATIBLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    COMPATIBLE_WITH_RESTRICTIONS: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    NOT_COMPATIBLE: 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(preselectedTerminalId ? `TerminalDetail?id=${preselectedTerminalId}` : preselectedVesselId ? `VesselDetail?id=${preselectedVesselId}` : 'Terminals')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminal Registration (Complex)</h1>
          <p className="text-gray-600">Step {step} of 3</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-cyan-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Select Terminal & Vessel</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Terminal registration approval is required before berth compatibility can be evaluated</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Terminal *</Label>
              <SearchableSelect
                value={terminalId}
                onValueChange={setTerminalId}
                options={terminals.map(t => ({ value: t.id, label: t.name }))}
                placeholder="Select terminal"
                searchPlaceholder="Search terminals..."
                disabled={!!preselectedTerminalId}
              />
            </div>

            <div className="space-y-2">
              <Label>Vessel *</Label>
              <SearchableSelect
                value={vesselId}
                onValueChange={setVesselId}
                options={vessels.filter(v => v.isActive !== false).map(v => ({ 
                  value: v.id, 
                  label: `${v.name} (IMO: ${v.imoNumber || v.imo_number})` 
                }))}
                placeholder="Select vessel"
                searchPlaceholder="Search vessels..."
                disabled={!!preselectedVesselId}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={createAppMutation.isPending}>
                {createAppMutation.isPending ? 'Creating...' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && application && (
        <div className="space-y-4">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registration Document Requirements</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {terminal?.name} • {vessel?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Only documents marked for Registration stage are required
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setShowDocumentUpdatedBanner(false);
                    await evaluateRegistration(applicationId);
                    queryClient.invalidateQueries(['checklistItems']);
                    toast.success('Requirements re-evaluated');
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recalculate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showDocumentUpdatedBanner && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Document updated</p>
                      <p className="text-sm text-blue-800">Click Recalculate to refresh registration status</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDocumentUpdatedBanner(false)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              {missingMandatory > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Registration cannot be completed yet</p>
                      <p className="text-sm text-amber-800">Please update the required documents marked as Missing or Expired using the Update button</p>
                    </div>
                  </div>
                </div>
              )}
              {missingMandatory === 0 && checklistItems.length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-900">All required registration documents are valid</p>
                      <p className="text-sm text-emerald-800">You may now submit the registration for approval</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-2xl font-bold text-emerald-400">{satisfiedCount}</p>
                  <p className="text-sm text-gray-600">Satisfied</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-2xl font-bold text-red-400">{missingMandatory}</p>
                  <p className="text-sm text-gray-600">Missing</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-amber-400">{expiredCount}</p>
                  <p className="text-sm text-gray-600">Expired</p>
                </div>
              </div>

              <div className="space-y-3">
                {checklistItems.map(item => {
                  const docType = docTypes.find(dt => dt.id === item.documentTypeId);
                  const needsUpdate = item.evaluationStatus === 'MISSING' || item.evaluationStatus === 'EXPIRED';
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3 flex-1">
                        {statusIcons[item.evaluationStatus]}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{docType?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.isMandatory && (
                              <Badge variant="outline" className="text-xs text-red-600">
                                Mandatory
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusColors[item.evaluationStatus]} border`}>
                          {item.evaluationStatus}
                        </Badge>
                        {needsUpdate && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUpdatingDocTypeId(item.documentTypeId)}
                            className="border-cyan-500 text-cyan-600 hover:bg-cyan-50"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={missingMandatory > 0 || approveMutation.isPending}>
              {approveMutation.isPending ? 'Processing...' : 'Submit for Approval'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && application && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              Registration Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="font-medium text-emerald-900">
                {vessel?.name} is approved for operations at {terminal?.name}
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                Berth compatibility has been calculated automatically
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Berth Compatibility</h3>
              <p className="text-sm text-gray-600">Based on vessel dimensions and berth operational constraints</p>
            </div>

            <div className="space-y-3">
              {compatibilities.map(comp => {
                const berth = berths.find(b => b.id === comp.berthId);
                return (
                  <div key={comp.id} className={`p-4 rounded-lg border ${compatibilityColors[comp.compatibilityStatus]}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-5 h-5" />
                        <span className="font-medium text-gray-900">{berth?.berthName || berth?.berth_number}</span>
                      </div>
                      <Badge className={`${compatibilityColors[comp.compatibilityStatus]} border`}>
                        {comp.compatibilityStatus.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {comp.restrictions && comp.restrictions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Restrictions:</p>
                        {comp.restrictions.map((r, i) => (
                          <p key={i} className="text-xs text-gray-600">• {r}</p>
                        ))}
                      </div>
                    )}
                    {comp.incompatibilityReasons && comp.incompatibilityReasons.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-red-700">Incompatibility Reasons:</p>
                        {comp.incompatibilityReasons.map((r, i) => (
                          <p key={i} className="text-xs text-red-600">• {r}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button onClick={() => navigate(createPageUrl(`TerminalDetail?id=${terminalId}`))}>
              Return to Terminal
            </Button>
          </CardContent>
        </Card>
      )}

      <UpdateDocumentDialog
        open={!!updatingDocTypeId}
        onOpenChange={(open) => !open && setUpdatingDocTypeId(null)}
        vesselId={vesselId}
        vesselPublicId={vessel?.publicId}
        documentTypeId={updatingDocTypeId}
        onSuccess={() => {
          setUpdatingDocTypeId(null);
          setShowDocumentUpdatedBanner(true);
        }}
      />
    </div>
  );
}