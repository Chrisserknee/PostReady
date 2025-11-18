'use client';

import { useState, useEffect } from 'react';

interface PageAnalysis {
  id: string;
  user_id: string | null;
  username: string;
  full_name: string;
  bio_links: string;
  follower_count: string;
  post_count: string;
  social_link: string;
  analysis_text: string;
  screenshot_url: string;
  screenshot_signed_url?: string;
  created_at: string;
}

export default function AdminPageAnalyses() {
  const [analyses, setAnalyses] = useState<PageAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PageAnalysis | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchAnalyses();
    } else {
      setLoading(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production, use environment variable
    if (password === 'Yobfesh1325519*') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPasswordError('');
      fetchAnalyses();
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/page-analyses');
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = () => {
    setIsExporting(true);
    try {
      // Convert to CSV
      const headers = ['ID', 'Username', 'Full Name', 'Followers', 'Posts', 'Bio Links', 'Social Link', 'Created At'];
      const csvRows = [headers.join(',')];
      
      analyses.forEach(analysis => {
        const row = [
          analysis.id,
          analysis.username || '',
          analysis.full_name || '',
          analysis.follower_count || '',
          analysis.post_count || '',
          `"${analysis.bio_links || ''}"`,
          analysis.social_link || '',
          new Date(analysis.created_at).toLocaleString()
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postready-analyses-${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (analysisId: string) => {
    if (!confirm('Are you sure you want to permanently delete this analysis and screenshot? This cannot be undone.')) {
      return;
    }

    setDeletingId(analysisId);
    try {
      const response = await fetch('/api/admin/page-analyses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
        if (selectedAnalysis?.id === analysisId) {
          setSelectedAnalysis(null);
        }
        alert('Analysis deleted successfully');
      } else {
        alert('Failed to delete analysis: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPassword('');
    setAnalyses([]);
  };

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔒 Admin Access</h1>
            <p className="text-gray-600">Enter password to view page analyses</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter admin password"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Access Dashboard
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Access is restricted to authorized administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Page Analyses Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage and export user analysis data</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Total Analyses</p>
            <p className="text-3xl font-bold text-blue-600">{analyses.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Export Data</p>
              <p className="text-sm text-gray-500">Download all analyses as CSV</p>
            </div>
            <button
              onClick={handleExportAll}
              disabled={isExporting || analyses.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isExporting ? 'Exporting...' : '📥 Export All'}
            </button>
          </div>
        </div>

        {/* Analyses List */}
        <div className="grid grid-cols-1 gap-6">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {analysis.username || 'Anonymous'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(analysis.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    {selectedAnalysis?.id === analysis.id ? 'Hide' : 'View'}
                  </button>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    disabled={deletingId === analysis.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50"
                  >
                    {deletingId === analysis.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {analysis.full_name && (
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-900">{analysis.full_name}</p>
                  </div>
                )}
                {analysis.follower_count && (
                  <div>
                    <p className="text-xs text-gray-500">Followers</p>
                    <p className="font-semibold text-gray-900">{analysis.follower_count}</p>
                  </div>
                )}
                {analysis.post_count && (
                  <div>
                    <p className="text-xs text-gray-500">Posts</p>
                    <p className="font-semibold text-gray-900">{analysis.post_count}</p>
                  </div>
                )}
                {analysis.social_link && (
                  <div>
                    <p className="text-xs text-gray-500">Profile</p>
                    <a
                      href={analysis.social_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline truncate block"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </div>

              {analysis.bio_links && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Bio Links</p>
                  <p className="text-sm text-gray-700">{analysis.bio_links}</p>
                </div>
              )}

              {selectedAnalysis?.id === analysis.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {analysis.screenshot_signed_url && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Screenshot</h3>
                      <img
                        src={analysis.screenshot_signed_url}
                        alt="Page screenshot"
                        className="max-w-full rounded-lg shadow-md border border-gray-200"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">AI Analysis</h3>
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700">
                      {analysis.analysis_text}
                    </div>
                  </div>

                  {analysis.user_id && (
                    <div className="mt-4 text-xs text-gray-500">
                      User ID: {analysis.user_id}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {analyses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No analyses yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
