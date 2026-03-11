'use client';

import { useState } from 'react';
import { Save, Server, Globe, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlanSelector } from '@/components/plan-selector';
import { useConfig } from '@/lib/hooks';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { data: config, mutate: mutateConfig } = useConfig();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    defaultPlan: config?.defaultPlan || 's-1vcpu-2gb',
    domain: config?.domain || '',
    subdomain: config?.subdomain || 'mc',
    maxSessionHours: config?.maxSessionHours || 8,
    region: config?.region || 'sgp1',
  });

  // Update form when config loads
  if (config && !form.domain && config.domain) {
    setForm({
      defaultPlan: config.defaultPlan,
      domain: config.domain,
      subdomain: config.subdomain,
      maxSessionHours: config.maxSessionHours,
      region: config.region,
    });
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig(form);
      mutateConfig();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your server panel</p>
      </div>

      {/* Server Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-emerald-400" />
            Server Defaults
          </CardTitle>
          <CardDescription>Default configuration for new server sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default VPS Plan</Label>
            <PlanSelector
              value={form.defaultPlan}
              onValueChange={(value) => setForm({ ...form, defaultPlan: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Default Region</Label>
            <Input
              id="region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="sgp1"
            />
            <p className="text-xs text-slate-500">DigitalOcean datacenter region slug</p>
          </div>
        </CardContent>
      </Card>

      {/* Domain Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-blue-400" />
            Domain Configuration
          </CardTitle>
          <CardDescription>Configure DNS for your Minecraft server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="yourdomain.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={form.subdomain}
              onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
              placeholder="mc"
            />
            <p className="text-xs text-slate-500">
              Players will connect to{' '}
              <span className="text-slate-300">
                {form.subdomain || 'mc'}.{form.domain || 'yourdomain.com'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-amber-400" />
            Session Limits
          </CardTitle>
          <CardDescription>Auto-stop protection for runaway sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxHours">Max Session Hours</Label>
            <Input
              id="maxHours"
              type="number"
              min={1}
              max={24}
              value={form.maxSessionHours}
              onChange={(e) =>
                setForm({ ...form, maxSessionHours: parseInt(e.target.value, 10) || 8 })
              }
            />
            <p className="text-xs text-slate-500">
              Server will auto-stop after this many hours to prevent billing overruns
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-red-400" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Managed via environment variables on the backend server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              DigitalOcean API token, Spaces credentials, and other sensitive
              configuration are stored as environment variables on the backend server.
              They are never exposed to the frontend for security.
            </p>
            <Separator className="my-3" />
            <div className="space-y-1.5">
              {[
                'DO_API_TOKEN',
                'DO_SSH_KEY_ID',
                'DO_SPACES_KEY',
                'DO_SPACES_SECRET',
                'JWT_SECRET',
              ].map((envVar) => (
                <div key={envVar} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <code className="text-xs text-slate-400 font-mono">{envVar}</code>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
