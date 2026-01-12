import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  expected_deadline: string | null;
  budget_range: string | null;
  status: string;
  admin_notes: string | null;
  estimated_cost: number | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["feature-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FeatureRequest[];
    },
    enabled: !!user,
  });

  const createRequest = useMutation({
    mutationFn: async (data: Omit<FeatureRequest, "id" | "user_id" | "status" | "admin_notes" | "estimated_cost" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("feature_requests").insert({
        user_id: user?.id,
        ...data,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
    },
  });

  return {
    requests,
    isLoading,
    error,
    createRequest,
  };
}
