'use client';

import { History, Clock, DollarSign, HardDrive, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSessions } from '@/lib/hooks';

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Session History</h1>
        <p className="text-sm text-slate-400 mt-1">Past server sessions and cost tracking</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-12 w-12 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">No sessions yet</p>
            <p className="text-sm text-slate-600 mt-1">
              Start your first server session from the dashboard
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:border-slate-700 transition-colors">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Date and Time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-slate-200">
                        {new Date(session.startTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {session.backupStatus === 'success' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Backed up
                        </Badge>
                      ) : session.backupStatus === 'failed' ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Backup failed
                        </Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(session.startTime).toLocaleTimeString()}
                      {session.endTime && ` — ${new Date(session.endTime).toLocaleTimeString()}`}
                    </p>
                  </div>

                  {/* Right: Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-400">{session.plan}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-sm font-medium text-slate-300">
                        {session.duration !== null
                          ? session.duration < 60
                            ? `${session.duration}m`
                            : `${Math.floor(session.duration / 60)}h ${session.duration % 60}m`
                          : 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">
                        {session.costEstimate !== null
                          ? `$${session.costEstimate.toFixed(4)}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Total Cost Summary */}
          {sessions.length > 0 && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">
                    Total ({sessions.length} sessions)
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">
                      {Math.round(
                        sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60
                      )}
                      h total
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      $
                      {sessions
                        .reduce((acc, s) => acc + (s.costEstimate || 0), 0)
                        .toFixed(4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
