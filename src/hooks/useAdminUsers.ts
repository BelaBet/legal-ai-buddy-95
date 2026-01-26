import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "admin" | "user" | "premium" | "supremo";

interface AdminProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
  created_at: string;
  updated_at: string;
}

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  email: string | null;
  specialty: string | null;
  created_at: string;
  roles: AppRole[];
}

export function useAdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles using secure function that excludes sensitive data (phone, oab_number)
      const { data: profiles, error: profilesError } = await supabase
        .rpc("get_profiles_for_admin");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Map profiles to users with roles (sensitive fields are not included)
      const usersWithRoles: UserWithRole[] = (profiles as AdminProfile[]).map((profile) => {
        const roles = userRoles
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role as AppRole);

        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: null, // Email isn't accessible from profiles
          specialty: profile.specialty,
          created_at: profile.created_at,
          roles,
        };
      });

      return usersWithRoles;
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({
      userId,
      newRole,
      currentRoles,
    }: {
      userId: string;
      newRole: AppRole;
      currentRoles: AppRole[];
    }) => {
      // Remove existing non-admin roles
      const rolesToRemove = currentRoles.filter(
        (r) => r !== "admin" && r !== newRole
      );

      for (const role of rolesToRemove) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;
      }

      // Check if new role already exists
      const hasNewRole = currentRoles.includes(newRole);

      if (!hasNewRole) {
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: newRole,
        });

        if (error) throw error;
      }

      return { userId, newRole };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Role atualizada",
        description: "A role do usuário foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar role",
        description: error.message,
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    updateUserRole,
  };
}
