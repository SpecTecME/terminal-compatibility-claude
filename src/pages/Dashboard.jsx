import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Building2, 
  Ship, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Calendar,
  Anchor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays, addDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities'],
    queryFn: () => base44.entities.VesselCompatibility.list()
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.ApprovalSubmission.list('-created_date', 5)
  });

  // Calculate stats
  const expiringDocs = documents.filter(d => {
    if (!d.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(d.expiry_date), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const expiredDocs = documents.filter(d => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < new Date();
  });

  const approvedCount = compatibilities.filter(c => c.status === 'Approved').length;
  const pendingCount = compatibilities.filter(c => c.status === 'Under Review').length;

  const stats = [
    { 
      label: 'Terminals', 
      value: terminals.length, 
      icon: Building2, 
      color: 'from-cyan-500 to-blue-600',
      href: 'Terminals'
    },
    { 
      label: 'Fleet Vessels', 
      value: vessels.length, 
      icon: Ship, 
      color: 'from-violet-500 to-purple-600',
      href: 'Vessels'
    },
    { 
      label: 'Documents', 
      value: documents.length, 
      icon: FileText, 
      color: 'from-emerald-500 to-teal-600',
      href: 'Documents'
    },
    { 
      label: 'Expiring Soon', 
      value: expiringDocs.length, 
      icon: AlertTriangle, 
      color: 'from-amber-500 to-orange-600',
      alert: expiringDocs.length > 0,
      href: 'Documents'
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} variants={item}>
            <Link to={createPageUrl(stat.href)}>
              <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    {stat.alert && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Compatibility Overview */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">Compatibility Status</CardTitle>
              <Link to={createPageUrl('TerminalMap')}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  View Map <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-xs text-gray-600">Active vessel-terminal approvals</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-400">{approvedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Under Review</p>
                      <p className="text-xs text-gray-600">Pending terminal approval</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Approval Rate</span>
                    <span className="text-sm font-medium text-gray-900">
                      {compatibilities.length > 0 
                        ? Math.round((approvedCount / compatibilities.length) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={compatibilities.length > 0 ? (approvedCount / compatibilities.length) * 100 : 0} 
                    className="h-2 bg-slate-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <Card className="bg-white border-gray-200 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl('AddTerminal')} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Building2 className="w-4 h-4 mr-3" />
                  Add New Terminal
                </Button>
              </Link>
              <Link to={createPageUrl('AddVessel')} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Ship className="w-4 h-4 mr-3" />
                  Register New Vessel
                </Button>
              </Link>
              <Link to={createPageUrl('Documents')} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <FileText className="w-4 h-4 mr-3" />
                  Upload Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Expiring Documents */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <motion.div variants={item}>
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No recent submissions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          sub.status === 'Approved' ? 'bg-emerald-500/10' :
                          sub.status === 'Submitted' || sub.status === 'Under Review' ? 'bg-amber-500/10' :
                          'bg-slate-500/10'
                        }`}>
                          {sub.status === 'Approved' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Submission #{sub.id.slice(-6)}</p>
                          <p className="text-xs text-gray-600">
                            {sub.submission_date ? format(new Date(sub.submission_date), 'MMM d, yyyy') : 'Draft'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        sub.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        sub.status === 'Submitted' || sub.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        sub.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      } border`}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expiring Documents */}
        <motion.div variants={item}>
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Expiring Documents
              </CardTitle>
              <Link to={createPageUrl('Documents')}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {expiringDocs.length === 0 && expiredDocs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-50" />
                  <p>All documents are up to date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...expiredDocs, ...expiringDocs].slice(0, 5).map((doc) => {
                    const isExpired = new Date(doc.expiry_date) < new Date();
                    const daysLeft = differenceInDays(new Date(doc.expiry_date), new Date());
                    return (
                      <div key={doc.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                        isExpired 
                          ? 'bg-red-500/5 border-red-500/30' 
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isExpired ? 'bg-red-500/10' : 'bg-amber-500/10'
                          }`}>
                            <Calendar className={`w-4 h-4 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.document_name}</p>
                            <p className="text-xs text-gray-600">{doc.category}</p>
                          </div>
                        </div>
                        <Badge className={`${
                          isExpired 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        } border`}>
                          {isExpired ? 'Expired' : `${daysLeft} days left`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}