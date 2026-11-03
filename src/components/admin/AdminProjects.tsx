import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { callAdmin } from "@/lib/admin-api";

interface Project { id: string; name: string; description: string | null; type: string | null; status: string | null; created_at: string }
const emptyForm = { id: "", name: "", description: "", type: "web", status: "active" };

export function AdminProjects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const fail = (e: unknown) => toast({ title: "Something went wrong", description: (e as Error).message, variant: "destructive" });

  const load = () => callAdmin<{ projects: Project[] }>({ action: "list_projects" }).then((r) => setProjects(r.projects)).catch(fail);
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setBusy(true);
    try { await callAdmin({ action: "save_project", ...form }); setForm(emptyForm); await load(); toast({ title: "Project saved" }); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };
  const del = async (p: Project) => {
    if (!window.confirm(`Delete project "${p.name}"?`)) return;
    try { await callAdmin({ action: "delete_project", id: p.id }); await load(); } catch (e) { fail(e); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">VortexCore projects</CardTitle>
        <p className="text-sm text-muted-foreground">Stored in the control room. Only VortexCore's projects are shown; other apps' projects can't be changed from here.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_110px_120px_auto]">
          <Input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Project name" />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
          <Input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="Type" />
          <select aria-label="Status" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || !form.name.trim()} className="gap-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{form.id ? "Save" : "Add"}
            </Button>
            {form.id && <Button variant="ghost" onClick={() => setForm(emptyForm)}>Cancel</Button>}
          </div>
        </div>
        {projects === null ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No VortexCore projects yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1 font-medium">{p.name}
                    {p.type && <Badge variant="outline">{p.type}</Badge>}
                    {p.status && <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>}
                  </div>
                  {p.description && <p className="truncate text-sm text-muted-foreground">{p.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit project" onClick={() => setForm({ id: p.id, name: p.name, description: p.description ?? "", type: p.type ?? "web", status: p.status ?? "active" })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete project" onClick={() => del(p)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
