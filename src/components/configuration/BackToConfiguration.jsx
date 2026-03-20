import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackToConfiguration({ to = 'ConfigurationSystemConfig', label = 'Back', onClickOverride }) {
  if (onClickOverride) {
    return (
      <button onClick={onClickOverride} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        {label}
      </button>
    );
  }
  return (
    <Link to={createPageUrl(to)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm">
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}