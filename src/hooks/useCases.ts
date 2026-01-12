import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Case {
  id: string;
  case_number: string;
  title: string;
  client: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Case[];
    },
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: { case_number: string; title: string; client: string; type?: string; status?: string }) => {
      const { data, error } = await supabase
        .from("cases")
        .insert({
          case_number: caseData.case_number,
          title: caseData.title,
          client: caseData.client,
          type: caseData.type || "Cível",
          status: caseData.status || "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating case:", error);
      toast.error("Erro ao criar caso");
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Case> & { id: string }) => {
      const { data, error } = await supabase
        .from("cases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso atualizado!");
    },
    onError: (error) => {
      console.error("Error updating case:", error);
      toast.error("Erro ao atualizar caso");
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso excluído!");
    },
    onError: (error) => {
      console.error("Error deleting case:", error);
      toast.error("Erro ao excluir caso");
    },
  });
}
