import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';

export default function RegistrationEntrypoint() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get('applicationId');
  const terminalId = urlParams.get('terminalId');
  const vesselId = urlParams.get('vesselId');

  const { data: companySecurityPolicy, isLoading: isLoadingPolicy } = useQuery({
    queryKey: ['companySecurityPolicy'],
    queryFn: () => base44.entities.CompanySecurityPolicy.list().then(r => r[0] || {}),
    staleTime: Infinity,
  });

  const { data: existingApplication, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => base44.entities.TerminalRegistrationApplication.filter({ id: applicationId }).then(r => r[0]),
    enabled: !!applicationId,
  });

  useEffect(() => {
    if (isLoadingPolicy || (applicationId && isLoadingApplication)) {
      return;
    }

    let targetPage = 'ComplexRegistration';
    let params = {};

    if (applicationId && existingApplication) {
      targetPage = existingApplication.documentApprovalMode === 'SIMPLE' ? 'SimpleRegistration' : 'ComplexRegistration';
      params.applicationId = applicationId;
    } else {
      if (companySecurityPolicy?.documentApprovalMode === 'SIMPLE') {
        targetPage = 'SimpleRegistration';
      }
      if (terminalId) params.terminalId = terminalId;
      if (vesselId) params.vesselId = vesselId;
    }

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    navigate(createPageUrl(`${targetPage}${queryString ? '?' + queryString : ''}`), { replace: true });
  }, [applicationId, terminalId, vesselId, companySecurityPolicy, existingApplication, isLoadingPolicy, isLoadingApplication, navigate]);

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-3 text-gray-700">Loading registration...</p>
    </div>
  );
}