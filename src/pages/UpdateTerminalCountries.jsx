import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Upload, Play, AlertCircle, CheckCircle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UpdateTerminalCountries() {
  const [file, setFile] = useState(null);
  const [previewOnly, setPreviewOnly] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleUpdate = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setProcessing(true);
    setResults(null);

    try {
      // Read CSV file
      const text = await file.text();
      const csvRows = parseCSV(text);

      // Fetch all terminals and countries
      const terminals = await base44.entities.Terminal.list();
      const countries = await base44.entities.Country.list();

      const stats = {
        total: csvRows.length,
        updated: 0,
        notFound: [],
        skipped: 0,
        errors: []
      };

      for (const row of csvRows) {
        try {
          const publicId = row.publicId || row.PublicId;

          if (!publicId) {
            stats.errors.push({
              publicId: 'N/A',
              reason: 'Missing publicId in CSV row'
            });
            continue;
          }

          // Find terminal by publicId
          const terminal = terminals.find(t => t.publicId === publicId);

          if (!terminal) {
            stats.notFound.push({
              publicId,
              reason: 'Terminal not found in database'
            });
            continue;
          }

          // Get country code and name from CSV (prefer legacy fields)
          const countryCode = row.legacyCountryCode || row.countryCode || '';
          const countryName = row.legacyCountryName || row.countryName || '';

          // Skip if both are blank
          if (!countryCode && !countryName) {
            stats.skipped++;
            continue;
          }

          // Try to match country
          let matchedCountry = null;

          if (countryCode) {
            matchedCountry = countries.find(
              c => c.iso2?.toLowerCase() === countryCode.toLowerCase()
            );
          }

          if (!matchedCountry && countryName) {
            matchedCountry = countries.find(
              c => c.nameEn?.toLowerCase() === countryName.toLowerCase()
            );
          }

          // Prepare update data
          const updateData = {
            legacyCountryCode: countryCode || terminal.legacyCountryCode,
            legacyCountryName: countryName || terminal.legacyCountryName
          };

          // If country matched, also update countryId and countryPublicId
          if (matchedCountry) {
            updateData.countryId = matchedCountry.id;
            updateData.countryPublicId = matchedCountry.publicId;
          }

          // Update terminal if not preview mode
          if (!previewOnly) {
            await base44.entities.Terminal.update(terminal.id, updateData);
          }

          stats.updated++;
        } catch (err) {
          stats.errors.push({
            publicId: row.publicId || 'N/A',
            reason: err.message
          });
        }
      }

      setResults(stats);
      toast.success(previewOnly ? 'Preview completed' : 'Update completed');
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadErrorReport = () => {
    if (!results) return;

    const reportRows = [
      ['Type', 'PublicId', 'Reason']
    ];

    results.notFound.forEach(item => {
      reportRows.push(['Not Found', item.publicId, item.reason]);
    });

    results.errors.forEach(item => {
      reportRows.push(['Error', item.publicId, item.reason]);
    });

    const csvContent = reportRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-update-errors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Update Terminal Countries</h1>
        <p className="text-gray-600 mt-1">Update country fields for existing terminals from CSV</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">CSV Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Required CSV columns:</strong> publicId, legacyCountryCode (or countryCode), legacyCountryName (or countryName)
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-1">
              <li>Only existing terminals will be updated (matched by publicId)</li>
              <li>No new terminal records will be created</li>
              <li>Only country fields will be modified</li>
              <li>Blank country values will be skipped</li>
              <li>If country code/name matches a Country record, countryId will also be populated</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Select CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="bg-white border-gray-300"
              />
              {file && (
                <p className="text-sm text-gray-600">
                  Selected: <strong>{file.name}</strong>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Switch
                checked={previewOnly}
                onCheckedChange={setPreviewOnly}
                id="preview-mode"
              />
              <div className="flex-1">
                <Label htmlFor="preview-mode" className="text-gray-900 font-medium cursor-pointer">
                  Preview Only (Dry Run)
                </Label>
                <p className="text-xs text-gray-600">
                  {previewOnly ? 'No changes will be saved' : 'Changes will be saved to database'}
                </p>
              </div>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={!file || processing}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  {previewOnly ? <Upload className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {previewOnly ? 'Preview Update' : 'Run Update'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {previewOnly ? 'Preview Results' : 'Update Results'}
                </CardTitle>
                {(results.notFound.length > 0 || results.errors.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                    className="border-gray-300 text-gray-700"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Error Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">{results.total}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700">Updated</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">{results.updated}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-700">Not Found</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{results.notFound.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700">Skipped (Blank)</p>
                  <p className="text-2xl font-bold text-blue-900">{results.skipped}</p>
                </div>
              </div>

              {previewOnly && results.updated > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>Preview Mode:</strong> Turn off "Preview Only" and click "Run Update" to save changes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(results.notFound.length > 0 || results.errors.length > 0) && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Errors & Not Found</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Type</TableHead>
                      <TableHead className="text-gray-600">Public ID</TableHead>
                      <TableHead className="text-gray-600">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.notFound.map((item, idx) => (
                      <TableRow key={`nf-${idx}`} className="border-gray-200">
                        <TableCell>
                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Not Found
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-900">{item.publicId}</TableCell>
                        <TableCell className="text-gray-700">{item.reason}</TableCell>
                      </TableRow>
                    ))}
                    {results.errors.map((item, idx) => (
                      <TableRow key={`err-${idx}`} className="border-gray-200">
                        <TableCell>
                          <Badge className="bg-red-500/10 text-red-400 border border-red-500/30">
                            Error
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-900">{item.publicId}</TableCell>
                        <TableCell className="text-gray-700">{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}