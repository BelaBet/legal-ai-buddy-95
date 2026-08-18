import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "admin" | "user" | "premium" | "supremo";
interface AdminProfile { id: string; user_id: string; full_name: string | null; avatar_url: string | null; specialty: string | null; created_at: string; updated_at: string; }
interface UserWithRole { user_id: string; full_name: string | null; email: string | null; specialty: string | null; created_at: string; roles: AppRole[]; }

export function useAdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase.rpc("get_profiles_for_admin");
      if (profilesError) throw profilesError;
      const { data: userRoles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;
      return (profiles as AdminProfile[]).map((profile): UserWithRole => ({
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: null,
        specialty: profile.specialty,
        created_at: profile.created_at,
        roles: userRoles.filter((r) => r.user_id === profile.user_id).map((r) => r.role as AppRole),
      }));
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole; currentRoles?: AppRole[] }) => {
      const { data, error } = await supabase.functions.invoke("admin-update-role", { body: { userId, newRole } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Role atualizada", description: "A role do usuário foi atualizada com sucesso." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Erro ao atualizar role", description: error.message }),
  });

  return { users, isLoading, error, updateUserRole };
}
