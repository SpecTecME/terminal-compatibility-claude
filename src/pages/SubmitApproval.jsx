import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Send, 
  ArrowLeft,
  Ship,
  Building2,
  Anchor,
  FileText,
  CheckCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function SubmitApproval() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const vesselId = urlParams.get('vessel');
  const terminalId = urlParams.get('terminal');

  const [selectedBerths, setSelectedBerths] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [notes, setNotes] = useState('');

  const { data: vessel } = useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => base44.entities.Vessel.filter({ id: vesselId }).then(r => r[0]),
    enabled: !!vesselId
  });

  const { data: terminal } = useQuery({
    queryKey: ['terminal', terminalId],
    queryFn: () => base44.entities.Terminal.filter({ id: terminalId }).then(r => r[0]),
    enabled: !!terminalId
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths', terminalId],
    queryFn: () => base44.entities.Berth.filter({ terminal_id: terminalId }),
    enabled: !!terminalId
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements', terminalId],
    queryFn: () => base44.entities.TerminalDocumentRequirement.filter({ terminal_id: terminalId }),
    enabled: !!terminalId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', vesselId],
    queryFn: () => base44.entities.Document.filter({ vessel_id: vesselId }),
    enabled: !!vesselId
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Create the submission
      const submission = await base44.entities.ApprovalSubmission.create({
        vessel_id: vesselId,
        terminal_id: terminalId,
        berth_ids: selectedBerths,
        document_ids: selectedDocs,
        submission_date: new Date().toISOString().split('T')[0],
        status: 'Submitted',
        submitted_by: (await base44.auth.me()).email,
        reviewer_email: terminal?.contact_email
      });

      // Create/update compatibility records
      const compatibilityPromises = selectedBerths.map(berthId => 
        base44.entities.VesselCompatibility.create({
          vessel_id: vesselId,
          terminal_id: terminalId,
          berth_id: berthId,
          status: 'Under Review',
          application_date: new Date().toISOString().split('T')[0]
        })
      );

      // If no specific berths selected, create one for the whole terminal
      if (selectedBerths.length === 0) {
        await base44.entities.VesselCompatibility.create({
          vessel_id: vesselId,
          terminal_id: terminalId,
          status: 'Under Review',
          application_date: new Date().toISOString().split('T')[0]
        });
      } else {
        await Promise.all(compatibilityPromises);
      }

      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['compatibilities'] });
      toast.success('Approval request submitted successfully');
      navigate(createPageUrl(`VesselDetail?id=${vesselId}`));
    },
    onError: (error) => {
      toast.error('Failed to submit approval request');
    }
  });

  const toggleBerth = (berthId) => {
    setSelectedBerths(prev => 
      prev.includes(berthId) 
        ? prev.filter(id => id !== berthId)
        : [...prev, berthId]
    );
  };

  const toggleDoc = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllBerths = () => {
    if (selectedBerths.length === berths.length) {
      setSelectedBerths([]);
    } else {
      setSelectedBerths(berths.map(b => b.id));
    }
  };

  const getDocStatus = (doc) => {
    if (!doc.expiry_date) return { status: 'Valid', color: 'text-emerald-400' };
    const days = differenceInDays(new Date(doc.expiry_date), new Date());
    if (days < 0) return { status: 'Expired', color: 'text-red-400' };
    if (days <= 30) return { status: 'Expiring', color: 'text-amber-400' };
    return { status: 'Valid', color: 'text-emerald-400' };
  };

  // Check which required documents are missing
  const getMissingDocs = () => {
    const mandatoryReqs = requirements.filter(r => r.is_mandatory);
    const availableCategories = documents.map(d => d.category);
    return mandatoryReqs.filter(r => !availableCategories.includes(r.document_category));
  };

  const missingDocs = getMissingDocs();

  if (!vessel || !terminal) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(`VesselDetail?id=${vesselId}`)}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit for Approval</h1>
          <p className="text-gray-600 mt-1">Request terminal compatibility approval</p>
        </div>
      </div>

      {/* Vessel & Terminal Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Ship className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vessel</p>
                <p className="font-semibold text-gray-900">{vessel.name}</p>
                <p className="text-xs text-gray-600">IMO: {vessel.imo_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Terminal</p>
                <p className="font-semibold text-gray-900">{terminal.name}</p>
                <p className="text-xs text-gray-600">{terminal.port}, {terminal.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Documents Warning */}
      {missingDocs.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400">Missing Required Documents</p>
                <p className="text-sm text-gray-600 mt-1">
                  The following mandatory documents are missing for this terminal:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {missingDocs.map((req, i) => (
                    <Badge key={i} className="bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {req.document_name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Berth Selection */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Anchor className="w-5 h-5 text-cyan-400" />
                Select Berths
              </CardTitle>
              <CardDescription className="text-gray-600">
                Choose which berths to apply for approval
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectAllBerths}
              className="border-slate-600 text-slate-300"
            >
              {selectedBerths.length === berths.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {berths.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No berths configured for this terminal</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {berths.map((berth) => {
                const isSelected = selectedBerths.includes(berth.id);
                return (
                  <div 
                    key={berth.id}
                    onClick={() => toggleBerth(berth.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-cyan-500/10 border-cyan-500/50' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{berth.berth_number}</p>
                        <div className="flex gap-2 mt-1">
                          {berth.max_loa && (
                            <span className="text-xs text-gray-600">LOA: {berth.max_loa}m</span>
                          )}
                          {berth.max_draft && (
                            <span className="text-xs text-gray-600">Draft: {berth.max_draft}m</span>
                          )}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected 
                          ? 'bg-cyan-500 border-cyan-500' 
                          : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Selection */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Select Documents to Include
          </CardTitle>
          <CardDescription className="text-slate-400">
            Choose documents to submit with your approval request
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-500">No documents available</p>
              <Link to={createPageUrl(`UploadDocument?vessel=${vesselId}`)}>
                <Button size="sm" variant="outline" className="mt-4 border-slate-600 text-slate-300">
                  Upload Documents
                </Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isSelected = selectedDocs.includes(doc.id);
                  const { status, color } = getDocStatus(doc);
                  return (
                    <div 
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-cyan-500/50' 
                          : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected 
                              ? 'bg-cyan-500 border-cyan-500' 
                              : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.document_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                                {doc.category}
                              </Badge>
                              <span className={`text-xs ${color}`}>{status}</span>
                            </div>
                          </div>
                        </div>
                        {doc.expiry_date && (
                          <span className="text-xs text-gray-600">
                            Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6">
          <Label className="text-gray-700">Additional Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-white mt-2 min-h-[100px]"
            placeholder="Any additional information for the terminal reviewer..."
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link to={createPageUrl(`VesselDetail?id=${vesselId}`)}>
          <Button variant="outline" className="border-slate-600 text-slate-300">
            Cancel
          </Button>
        </Link>
        <Button 
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || selectedDocs.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}