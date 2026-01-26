import { useState } from "react";
import { useAdminUsers, AppRole } from "@/hooks/useAdminUsers";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, Crown, User, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  user: "Usuário",
  premium: "Premium",
  supremo: "Supremo",
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  user: "bg-muted text-muted-foreground border-border",
  premium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  supremo: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  user: <User className="w-3 h-3" />,
  premium: <Crown className="w-3 h-3" />,
  supremo: <Crown className="w-3 h-3" />,
};

export function AdminUsersPage() {
  const { hasRole } = useAuth();
  const { users, isLoading, error, updateUserRole } = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = hasRole("admin");

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.user_id.toLowerCase().includes(searchLower) ||
      user.specialty?.toLowerCase().includes(searchLower)
    );
  });

  const getPrimaryRole = (roles: AppRole[]): AppRole => {
    if (roles.includes("supremo")) return "supremo";
    if (roles.includes("premium")) return "premium";
    if (roles.includes("admin")) return "admin";
    return "user";
  };

  const handleRoleChange = (userId: string, newRole: AppRole, currentRoles: AppRole[]) => {
    updateUserRole.mutate({ userId, newRole, currentRoles });
  };

  const userStats = {
    total: users?.length || 0,
    supremo: users?.filter((u) => u.roles.includes("supremo")).length || 0,
    premium: users?.filter((u) => u.roles.includes("premium")).length || 0,
    admin: users?.filter((u) => u.roles.includes("admin")).length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Administração de Usuários
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie usuários e altere níveis de acesso
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.supremo}</p>
              <p className="text-sm text-muted-foreground">Supremo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.premium}</p>
              <p className="text-sm text-muted-foreground">Premium</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.admin}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Lista de todos os usuários cadastrados
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar usuários: {error.message}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Roles Atuais</TableHead>
                    <TableHead>Alterar Role</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.full_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {user.user_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.specialty || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={`${roleColors[role]} flex items-center gap-1`}
                            >
                              {roleIcons[role]}
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={getPrimaryRole(user.roles)}
                          onValueChange={(value: AppRole) =>
                            handleRoleChange(user.user_id, value, user.roles)
                          }
                          disabled={updateUserRole.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="supremo">Supremo</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">
                          Nenhum usuário encontrado
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
