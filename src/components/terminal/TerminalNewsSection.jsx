import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function TerminalNewsSection({ terminalId }) {
  const { data: news = [] } = useQuery({
    queryKey: ['terminalNews', terminalId],
    queryFn: () => base44.entities.TerminalNews.filter({ terminal_id: terminalId }, '-published_date'),
    enabled: !!terminalId
  });

  if (news.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-cyan-600" />
          Recent News & Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.excerpt}</p>
                  {item.published_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.published_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                {item.full_url && (
                  <a 
                    href={item.full_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-cyan-600 hover:text-cyan-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}