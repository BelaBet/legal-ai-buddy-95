import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  shared_with: string;
  permission: "view" | "edit";
  created_at: string;
  shared_with_user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface SearchedUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export function useDocumentShares(documentId: string) {
  return useQuery({
    queryKey: ["document-shares", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_shares")
        .select("*")
        .eq("document_id", documentId);

      if (error) throw error;
      return data as DocumentShare[];
    },
    enabled: !!documentId,
  });
}

export function useSearchUsersForSharing() {
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error } = await supabase.rpc("search_users_for_sharing", {
        search_term: searchTerm,
      });

      if (error) throw error;
      return data as SearchedUser[];
    },
  });
}

export function useShareDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      sharedWith,
      permission,
    }: {
      documentId: string;
      sharedWith: string;
      permission: "view" | "edit";
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("document_shares")
        .insert({
          document_id: documentId,
          shared_by: user.id,
          shared_with: sharedWith,
          permission,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", variables.documentId] });
      toast.success("Documento compartilhado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error sharing document:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Documento já compartilhado com este usuário");
      } else {
        toast.error("Erro ao compartilhar documento");
      }
    },
  });
}

export function useRemoveShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, documentId }: { shareId: string; documentId: string }) => {
      const { error } = await supabase
        .from("document_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;
      return { shareId, documentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", data.documentId] });
      toast.success("Compartilhamento removido");
    },
    onError: (error) => {
      console.error("Error removing share:", error);
      toast.error("Erro ao remover compartilhamento");
    },
  });
}
