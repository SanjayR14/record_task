'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkBackendHealth } from '@/services/healthService';
import { CheckCircle2, AlertCircle, RefreshCw, Server, Database, Smartphone, ShieldCheck, ArrowRight, Video } from 'lucide-react';

export const LandingPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const performHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkBackendHealth();
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          Record Technology Labs
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Mobile Video Verification Flow
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
          Phase 2 Figma-based responsive frontend implementation. Fully styled to match the official design screens and onboarding specification.
        </p>
      </div>

      {/* Prominent Verification Flow Launch Card */}
      <Card className="border-[#FF5723]/30 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 shadow-md overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5723] uppercase tracking-wider">
              <Video className="w-4 h-4" />
              <span>Interactive Verification Flow</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Open Verification Application
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Experience all 8 sequential screens: Language selection, instructions, permissions, 3 video recording scenarios, review, and feedback.
            </p>
          </div>

          <Link href="/verify/demo-candidate-2026" className="w-full sm:w-auto flex-shrink-0">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <span>Start Verification</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </CardContent>
      </Card>

      {/* Backend Connectivity Status Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base sm:text-lg">Backend Health Check</CardTitle>
            </div>
            {loading ? (
              <Badge variant="secondary" className="gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
              </Badge>
            ) : healthData?.success ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> API Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Disconnected
              </Badge>
            )}
          </div>
          <CardDescription>
            Live verification of GET <code className="bg-slate-200/70 px-1 py-0.5 rounded text-xs font-mono">/api/health</code>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Backend Server Offline</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {healthData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 font-medium">Status Message</div>
                <div className="text-slate-900 font-semibold mt-0.5">{healthData.message}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">MongoDB State</span>
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-emerald-700 font-semibold mt-0.5 capitalize flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  {healthData.database?.status || 'Connected'}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{lastChecked ? `Last ping: ${lastChecked}` : 'Checking backend...'}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={performHealthCheck}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LandingPage;
