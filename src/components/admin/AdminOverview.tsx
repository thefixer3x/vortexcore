import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Activity, AppWindow, FolderKanban, Loader2, ReceiptText, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { callAdmin, type AdminStats } from "@/lib/admin-api";

const COLORS = [1, 2, 3, 4, 5].map((n) => `hsl(var(--chart-${n}))`);
const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 };

const Stat = ({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: number | string; hint?: string }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground/80">{hint}</div>}
      </div>
    </CardContent>
  </Card>
);

const Empty = ({ text }: { text: string }) => <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">{text}</p>;

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callAdmin<{ stats: AdminStats }>({ action: "stats" }).then((r) => setStats(r.stats)).catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <Card><CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent></Card>;
  if (!stats) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const t = stats.totals;
  const tx = stats.transactions_daily.map((d) => ({ ...d, label: d.day.slice(5) }));
  const hasTx = tx.some((d) => d.count > 0);
  const signups = stats.signups.map((s) => ({ ...s, label: new Date(`${s.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" }) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="VortexCore users" value={t.vortexcore_users} hint={`${t.organisation_users} across all apps · ${t.organisation_admins} admins`} />
        <Stat icon={Activity} label="Transactions" value={t.transactions} />
        <Stat icon={ReceiptText} label="Open obligations" value={t.open_obligations} hint={`${t.obligations} in total`} />
        <Stat icon={Wallet} label="Wallets" value={t.wallets} hint={`${t.projects} VortexCore projects`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Money in and out · last 30 days</CardTitle></CardHeader>
          <CardContent>
            {hasTx ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tx} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" {...axis} interval={6} />
                  <YAxis {...axis} width={50} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="credit" name="Money in" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="debit" name="Money out" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty text="No transactions in the last 30 days." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">New VortexCore users · last 12 months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signups} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} allowDecimals={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="count" name="New users" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Obligations by status</CardTitle></CardHeader>
          <CardContent>
            {stats.obligations_by_status.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.obligations_by_status} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {stats.obligations_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty text="No obligations yet." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Users by plan</CardTitle></CardHeader>
          <CardContent>
            {stats.plans.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.plans} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <XAxis type="number" {...axis} allowDecimals={false} />
                  <YAxis type="category" dataKey="tier" {...axis} width={80} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="count" name="Users" fill={COLORS[4]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty text="No users on a plan yet." />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><AppWindow className="h-4 w-4" /> Platform apps (control room)</CardTitle></CardHeader>
          <CardContent>
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {stats.platform_apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className={a.id === "vortexcore" ? "font-semibold" : ""}>{a.name}</span>
                  <span className="flex gap-1">
                    {a.migration_status && <Badge variant="outline" className="capitalize">{a.migration_status}</Badge>}
                    <Badge variant={a.is_active === false ? "secondary" : "default"} className="capitalize">{a.status ?? (a.is_active === false ? "inactive" : "active")}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FolderKanban className="h-4 w-4" /> Recent admin activity</CardTitle></CardHeader>
          <CardContent>
            {stats.recent_audit.length ? (
              <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
                {stats.recent_audit.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="capitalize">{a.action.replace(/_/g, " ")}{typeof a.details?.name === "string" ? ` · ${a.details.name}` : typeof a.details?.tier === "string" ? ` · ${a.details.tier}` : ""}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Changes you make here (roles, projects, prices) are recorded in the control room audit log.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
