import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AdminUser { id: string; email: string | null; role: string; created_at: string }
interface Project { id: string; name: string; description: string | null; type: string | null }

const call = async <T,>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("vortex-admin", { body });
  if (error) {
    let msg: string | undefined;
    try { msg = (await (error as { context?: Response }).context?.json())?.error; } catch { /* ignore */ }
    throw new Error(msg || "Request failed");
  }
  return data as T;
};

const emptyForm = { id: "", name: "", description: "", type: "" };

const Admin = () => {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => toast({ title: "Something went wrong", description: (e as Error).message, variant: "destructive" });

  const loadAll = useCallback(async () => {
    const [u, p] = await Promise.all([
      call<{ users: AdminUser[] }>({ action: "list_users" }),
      call<{ projects: Project[] }>({ action: "list_projects" }),
    ]);
    setUsers(u.users); setProjects(p.projects);
  }, []);

  useEffect(() => {
    call<{ is_admin: boolean }>({ action: "whoami" })
      .then(async (r) => { setIsAdmin(r.is_admin); if (r.is_admin) await loadAll(); })
      .catch(() => setIsAdmin(false));
  }, [loadAll]);

  const setRole = async (u: AdminUser, role: string) => {
    try { await call({ action: "set_role", user_id: u.id, role }); toast({ title: role === "admin" ? `${u.email} is now an admin` : `${u.email} is no longer an admin` }); await loadAll(); }
    catch (e) { fail(e); }
  };

  const saveProject = async () => {
    setBusy(true);
    try { await call({ action: "save_project", ...form }); setForm(emptyForm); await loadAll(); toast({ title: "Project saved" }); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };

  const deleteProject = async (p: Project) => {
    if (!window.confirm(`Delete project "${p.name}"?`)) return;
    try { await call({ action: "delete_project", id: p.id }); await loadAll(); } catch (e) { fail(e); }
  };

  if (isAdmin === null) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return (
    <Card><CardContent className="py-12 text-center text-muted-foreground">This area is for admins only.</CardContent></Card>
  );

  const shown = users.filter((u) => (u.email ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" /> Admin</h1>
        <p className="text-sm text-muted-foreground">Manage who has admin access and your company projects.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Users</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
          <ul className="divide-y divide-border">
            {shown.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-sm">{u.email ?? u.id}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === "user" ? "secondary" : "default"} className="capitalize">{u.role}</Badge>
                  {u.role === "admin" ? (
                    <Button size="sm" variant="outline" onClick={() => setRole(u, "user")}>Remove admin</Button>
                  ) : u.role !== "superadmin" ? (
                    <Button size="sm" onClick={() => setRole(u, "admin")}>Make admin</Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Company projects</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
            <Input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Project name" />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
            <Input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="Type" />
            <div className="flex gap-2">
              <Button onClick={saveProject} disabled={busy || !form.name.trim()} className="gap-1">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{form.id ? "Save" : "Add"}
              </Button>
              {form.id && <Button variant="ghost" onClick={() => setForm(emptyForm)}>Cancel</Button>}
            </div>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium">{p.name} {p.type && <Badge variant="outline" className="ml-1">{p.type}</Badge>}</div>
                    {p.description && <p className="truncate text-sm text-muted-foreground">{p.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="Edit project" onClick={() => setForm({ id: p.id, name: p.name, description: p.description ?? "", type: p.type ?? "" })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete project" onClick={() => deleteProject(p)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
