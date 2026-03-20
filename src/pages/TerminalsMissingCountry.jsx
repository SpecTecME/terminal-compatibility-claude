import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { AlertCircle, Search, Edit, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TerminalsMissingCountry() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const terminalsWithoutCountry = terminals.filter(t => !t.countryId);

  const filteredTerminals = terminalsWithoutCountry.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.port?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.legacyCountryCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.legacyCountryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminals Missing Country</h1>
          <p className="text-gray-600 mt-1">Terminals without a valid Country relationship</p>
        </div>
        <Link to={createPageUrl('MigrateTerminalCountries')}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Run Migration
          </Button>
        </Link>
      </div>

      {terminalsWithoutCountry.length > 0 && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong>{terminalsWithoutCountry.length}</strong> terminals are missing country information
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search terminals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white border-gray-300"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTerminals.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {terminalsWithoutCountry.length === 0 ? 'All terminals have countries!' : 'No matching terminals'}
          </h3>
          <p className="text-gray-600">
            {terminalsWithoutCountry.length === 0 
              ? 'All terminals have valid country relationships' 
              : 'Try adjusting your search'}
          </p>
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Terminal Name</TableHead>
                  <TableHead className="text-gray-600">Port</TableHead>
                  <TableHead className="text-gray-600">Legacy Country Code</TableHead>
                  <TableHead className="text-gray-600">Legacy Country Name</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerminals.map((terminal) => (
                  <TableRow key={terminal.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{terminal.name}</TableCell>
                    <TableCell className="text-gray-700">
                      {terminal.port ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          {terminal.port}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">{terminal.legacyCountryCode || '-'}</TableCell>
                    <TableCell className="text-gray-700">{terminal.legacyCountryName || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-red-500/10 text-red-400 border border-red-500/30">
                        Missing Country
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={createPageUrl(`EditTerminal?id=${terminal.id}`)}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}