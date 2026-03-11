'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import {
  Play,
  Square,
  Copy,
  Check,
  HardDrive,
  Clock,
  DollarSign,
  Globe,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { SessionTimer } from '@/components/session-timer';
import { CostEstimate } from '@/components/cost-estimate';
import { PlanSelector } from '@/components/plan-selector';
import { PlayerList } from '@/components/player-list';
import { useServerStatus, usePlayers, usePlans } from '@/lib/hooks';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { data: status, error: statusError } = useServerStatus();
  const { data: players } = usePlayers();
  const { data: plans } = usePlans();

  const [selectedPlan, setSelectedPlan] = useState('s-1vcpu-2gb');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPlan = plans?.find((p) => p.slug === (status?.selectedPlan || selectedPlan));
  const isOffline = !status || status.state === 'offline';
  const isOnline = status?.state === 'online';
  const isBusy = status?.state === 'creating' || status?.state === 'starting' ||
    status?.state === 'stopping' || status?.state === 'saving' || status?.state === 'destroying';

  const handleStart = async () => {
    setLoading(true);
    try {
      await api.startServer(selectedPlan);
      mutate('server-status');
    } catch (err) {
      console.error('Failed to start:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.stopServer();
      mutate('server-status');
    } catch (err) {
      console.error('Failed to stop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      await api.backupServer();
    } catch (err) {
      console.error('Failed to backup:', err);
    }
  };

  const copyIp = () => {
    if (status?.dropletIp) {
      navigator.clipboard.writeText(status.dropletIp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const domain = status?.dropletIp ? `mc.yourdomain.com` : null;

  if (statusError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-400 mb-2">Failed to connect to backend</p>
        <p className="text-sm text-slate-500">Make sure the backend is running</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your Minecraft server</p>
        </div>
        <StatusBadge state={status?.state || 'offline'} />
      </div>

      {/* Main Control Card */}
      <Card className="relative overflow-hidden">
        {/* Subtle glow effect when online */}
        {isOnline && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        )}

        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5 text-emerald-400" />
            Server Control
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan selector — only when offline */}
          {isOffline && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">VPS Plan</label>
              <PlanSelector
                value={selectedPlan}
                onValueChange={setSelectedPlan}
                disabled={!isOffline}
              />
              {currentPlan && (
                <p className="text-xs text-slate-500">
                  {currentPlan.memory >= 1024
                    ? `${currentPlan.memory / 1024} GB`
                    : `${currentPlan.memory} MB`}{' '}
                  RAM &middot; {currentPlan.vcpus} vCPU &middot; ${currentPlan.priceHourly}/hr
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {isOffline && (
              <Button onClick={handleStart} disabled={loading} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Start Server
              </Button>
            )}

            {(isOnline || status?.state === 'starting') && (
              <Button
                onClick={handleStop}
                disabled={loading || isBusy}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Server
              </Button>
            )}

            {isOnline && (
              <Button onClick={handleBackup} variant="outline" size="lg" className="gap-2">
                <Download className="h-4 w-4" />
                Backup Now
              </Button>
            )}
          </div>

          {/* Server IP */}
          {status?.dropletIp && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Server Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-slate-800/80 px-4 py-2.5 font-mono text-sm text-emerald-400 border border-slate-700">
                    {status.dropletIp}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyIp}>
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {domain && (
                  <p className="text-xs text-slate-500">
                    Also available at <span className="text-slate-400">{domain}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Session Duration */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-slate-400">Session Time</span>
            </div>
            <SessionTimer startTime={status?.sessionStart ?? null} />
          </CardContent>
        </Card>

        {/* Estimated Cost */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-slate-400">Session Cost</span>
            </div>
            <CostEstimate
              startTime={status?.sessionStart ?? null}
              priceHourly={currentPlan?.priceHourly ?? 0.018}
            />
          </CardContent>
        </Card>

        {/* Backup Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-400">Last Backup</span>
            </div>
            {status?.backup?.lastBackupTime ? (
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {new Date(status.backup.lastBackupTime).toLocaleDateString()}
                </p>
                {status.backup.lastBackupSize && (
                  <p className="text-xs text-slate-500">
                    {(status.backup.lastBackupSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No backups yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Players Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Players</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerList
            players={players?.players ?? []}
            playerCount={status?.playerCount ?? 0}
            maxPlayers={status?.maxPlayers ?? 20}
            online={isOnline || false}
          />
        </CardContent>
      </Card>

      {/* Active Plan Info */}
      {!isOffline && currentPlan && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Plan</p>
                <p className="text-base font-semibold text-slate-200">{currentPlan.label}</p>
              </div>
              <div className="text-right">
                <Badge variant="info">${currentPlan.priceHourly}/hr</Badge>
                <p className="text-xs text-slate-500 mt-1">{currentPlan.disk} GB SSD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
