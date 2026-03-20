/**
 * Home Page (Public Landing & Authentication)
 * 
 * PURPOSE:
 * Public-facing landing page with authentication flow.
 * Bypasses Layout.js wrapper for full design control.
 * 
 * CRITICAL BEHAVIOR (lines 13-26):
 * 
 * AUTO-REDIRECT FOR AUTHENTICATED USERS:
 * - On page load, checks authentication status
 * - If user already logged in → redirect to Dashboard
 * - Prevents showing login page to authenticated users
 * - Provides seamless experience
 * 
 * useEffect runs once on mount.
 * base44.auth.isAuthenticated() returns promise<boolean>.
 * 
 * LAYOUT BYPASS (Layout.js line 342):
 * Layout.js checks: if (currentPageName === 'Home') return children;
 * This page renders WITHOUT navigation sidebar.
 * Full creative freedom for landing page design.
 * 
 * TWO-PANEL DESIGN:
 * 
 * LEFT PANEL (lines 34-86):
 * Branding and marketing (desktop only, lg:flex):
 * - Gradient background (teal to cyan)
 * - Pattern overlay (SVG texture, 5% opacity)
 * - Logo with glassmorphism
 * - Value proposition headline
 * - Feature icons (3-column grid)
 * 
 * GRADIENT COLORS:
 * from-[#0A4D68] via-[#0E6B8C] to-[#088395]
 * Custom brand colors matching app theme.
 * 
 * RIGHT PANEL (lines 88-228):
 * Authentication forms (full width mobile, half width desktop):
 * - Tabbed interface (Sign In / Create Account)
 * - White card with shadow
 * - Disabled form fields (placeholder UI)
 * - Base44 platform handles actual auth
 * 
 * AUTHENTICATION DELEGATION:
 * 
 * DISABLED INPUTS (lines 143, 153, 182, 202, 212):
 * Forms are VISUAL ONLY, fields disabled.
 * 
 * ACTUAL AUTH:
 * Both buttons call handleSignIn() (lines 28-30, 158, 218).
 * Triggers base44.auth.redirectToLogin().
 * Platform redirects to Base44's login page.
 * After success, returns to Dashboard.
 * 
 * WHY PLACEHOLDER FORMS:
 * - Shows familiar login UX
 * - Maintains brand consistency
 * - Base44 handles security (OAuth, SSO, MFA)
 * - App doesn't manage passwords/sessions
 * 
 * RESPONSIVE DESIGN:
 * 
 * DESKTOP (lg breakpoint):
 * - 50/50 split (lg:w-1/2)
 * - Branding panel visible
 * - Form panel constrained to max-w-md
 * 
 * MOBILE:
 * - Full width (w-full)
 * - Branding panel hidden (hidden lg:flex)
 * - Compact logo shown (lines 91-100)
 * - Form takes full space
 * 
 * TAB STATE (lines 11, 105-126):
 * Local state controls Sign In vs Sign Up view.
 * Purely cosmetic (both redirect to same auth flow).
 * Matches user mental model of auth choices.
 * 
 * FEATURE CARDS (lines 62-81):
 * Visual preview of app capabilities:
 * - Vessel Registry (Ship icon)
 * - Terminal Management (Anchor icon)
 * - Global Coverage (Waves icon)
 * 
 * Glassmorphism styling (bg-white/10 backdrop-blur-sm).
 * Marketing / trust signals.
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Anchor, Ship, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          window.location.href = createPageUrl('Dashboard');
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A4D68] via-[#0E6B8C] to-[#088395] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNGgtMnYyaDJ2LTJ6bTIgMGgydjJoLTJ2LTJ6bTAgMnYyaDJ2LTJoLTJ6bS0yIDBoLTJ2Mmgydi0yek0zMiAzNGgydjJoLTJ2LTJ6bTAgMmgtMnYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Anchor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">LNG Terminal</h1>
              <p className="text-sm text-teal-100">Compatibility System</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Manage Terminal<br />Registrations Efficiently
              </h2>
              <p className="text-lg text-teal-50 leading-relaxed max-w-md">
                A comprehensive platform for vessel compatibility management, document tracking, and terminal approvals worldwide.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Ship className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-teal-50">Vessel Registry</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Anchor className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-teal-50">Terminal Management</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Waves className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-teal-50">Global Coverage</p>
              </div>
            </div>
          </div>

          <div></div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A4D68] to-[#088395] flex items-center justify-center">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LNG Terminal</h1>
              <p className="text-xs text-gray-600">Compatibility System</p>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'signin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Sign In Form */}
            {activeTab === 'signin' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h3>
                  <p className="text-sm text-gray-600">Enter your credentials to access your account</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      className="mt-1.5 h-11"
                      disabled
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="mt-1.5 h-11"
                      disabled
                    />
                  </div>

                  <Button
                    onClick={handleSignIn}
                    className="w-full h-11 bg-gradient-to-r from-[#0A4D68] to-[#088395] hover:from-[#083d54] hover:to-[#067080] text-white font-medium"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Create account</h3>
                  <p className="text-sm text-gray-600">Enter your details to get started</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input
                      type="text"
                      placeholder="John Smith"
                      className="mt-1.5 h-11"
                      disabled
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company Name (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="Shipping Corp Ltd"
                      className="mt-1.5 h-11"
                      disabled
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      className="mt-1.5 h-11"
                      disabled
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="mt-1.5 h-11"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Must be at least 8 characters</p>
                  </div>

                  <Button
                    onClick={handleSignIn}
                    className="w-full h-11 bg-gradient-to-r from-[#0A4D68] to-[#088395] hover:from-[#083d54] hover:to-[#067080] text-white font-medium"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}