import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { callAdmin } from "@/lib/admin-api";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminPricing } from "@/components/admin/AdminPricing";
import { AdminProjects } from "@/components/admin/AdminProjects";

interface AdminUser { id: string; email: string | null; role: string; created_at: string }

function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const load = useCallback(() => callAdmin<{ users: AdminUser[] }>({ action: "list_users" }).then((r) => setUsers(r.users))
    .catch((e) => toast({ title: "Couldn't load users", description: (e as Error).message, variant: "destructive" })), [toast]);
  useEffect(() => { void load(); }, [load]);

  const setRole = async (u: AdminUser, role: string) => {
    try {
      await callAdmin({ action: "set_role", user_id: u.id, role });
      toast({ title: role === "admin" ? `${u.email} is now an admin` : `${u.email} is no longer an admin` });
      await load();
    } catch (e) { toast({ title: "Something went wrong", description: (e as Error).message, variant: "destructive" }); }
  };

  const shown = (users ?? []).filter((u) => (u.email ?? "").toLowerCase().includes(search.toLowerCase()));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Users</CardTitle>
        <p className="text-sm text-muted-foreground">Accounts are shared across the organisation's apps.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        {users === null ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
          <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
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
        )}
      </CardContent>
    </Card>
  );
}

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    callAdmin<{ is_admin: boolean }>({ action: "whoami" }).then((r) => setIsAdmin(r.is_admin)).catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return <Card><CardContent className="py-12 text-center text-muted-foreground">This area is for admins only.</CardContent></Card>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" /> Admin</h1>
        <p className="text-sm text-muted-foreground">VortexCore at a glance, plus projects, plans and admin access.</p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><AdminOverview /></TabsContent>
        <TabsContent value="projects" className="mt-4"><AdminProjects /></TabsContent>
        <TabsContent value="pricing" className="mt-4"><AdminPricing /></TabsContent>
        <TabsContent value="users" className="mt-4"><AdminUsers /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
