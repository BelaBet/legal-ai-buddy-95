import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClickUpIntegration {
  id: string;
  user_id: string;
  api_token: string;
  workspace_id: string | null;
  list_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClickUpWorkspace {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: { status: string };
  due_date?: string;
  url: string;
}

export function useClickUpIntegration() {
  return useQuery({
    queryKey: ["clickup-integration"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clickup_integrations")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as ClickUpIntegration | null;
    },
  });
}

export function useSaveClickUpIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { api_token: string; workspace_id?: string; list_id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("clickup_integrations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("clickup_integrations")
          .update({
            api_token: data.api_token,
            workspace_id: data.workspace_id || null,
            list_id: data.list_id || null,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clickup_integrations")
          .insert({
            user_id: user.id,
            api_token: data.api_token,
            workspace_id: data.workspace_id || null,
            list_id: data.list_id || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clickup-integration"] });
      toast.success("Integração ClickUp salva com sucesso!");
    },
    onError: (error) => {
      console.error("Error saving ClickUp integration:", error);
      toast.error("Erro ao salvar integração. Verifique se você tem o plano Supremo.");
    },
  });
}

export function useDeleteClickUpIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("clickup_integrations")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clickup-integration"] });
      toast.success("Integração ClickUp removida!");
    },
    onError: (error) => {
      console.error("Error deleting ClickUp integration:", error);
      toast.error("Erro ao remover integração");
    },
  });
}

// ClickUp API helper functions
export async function fetchClickUpWorkspaces(apiToken: string): Promise<ClickUpWorkspace[]> {
  try {
    const response = await fetch("https://api.clickup.com/api/v2/team", {
      headers: {
        Authorization: apiToken,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch workspaces");

    const data = await response.json();
    return data.teams.map((team: any) => ({
      id: team.id,
      name: team.name,
    }));
  } catch (error) {
    console.error("Error fetching ClickUp workspaces:", error);
    return [];
  }
}

export async function fetchClickUpLists(apiToken: string, workspaceId: string): Promise<ClickUpList[]> {
  try {
    // First get spaces in the workspace
    const spacesResponse = await fetch(`https://api.clickup.com/api/v2/team/${workspaceId}/space`, {
      headers: { Authorization: apiToken },
    });

    if (!spacesResponse.ok) throw new Error("Failed to fetch spaces");

    const spacesData = await spacesResponse.json();
    const lists: ClickUpList[] = [];

    // Get folders and lists from each space
    for (const space of spacesData.spaces) {
      // Get folderless lists
      const listsResponse = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/list`, {
        headers: { Authorization: apiToken },
      });

      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        lists.push(...listsData.lists.map((list: any) => ({
          id: list.id,
          name: `${space.name} / ${list.name}`,
        })));
      }

      // Get folders
      const foldersResponse = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/folder`, {
        headers: { Authorization: apiToken },
      });

      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        for (const folder of foldersData.folders) {
          lists.push(...folder.lists.map((list: any) => ({
            id: list.id,
            name: `${space.name} / ${folder.name} / ${list.name}`,
          })));
        }
      }
    }

    return lists;
  } catch (error) {
    console.error("Error fetching ClickUp lists:", error);
    return [];
  }
}

export async function createClickUpTask(
  apiToken: string,
  listId: string,
  task: {
    name: string;
    description?: string;
    due_date?: number;
  }
): Promise<ClickUpTask | null> {
  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: "POST",
      headers: {
        Authorization: apiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) throw new Error("Failed to create task");

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      due_date: data.due_date,
      url: data.url,
    };
  } catch (error) {
    console.error("Error creating ClickUp task:", error);
    return null;
  }
}

export async function fetchClickUpTasks(apiToken: string, listId: string): Promise<ClickUpTask[]> {
  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      headers: { Authorization: apiToken },
    });

    if (!response.ok) throw new Error("Failed to fetch tasks");

    const data = await response.json();
    return data.tasks.map((task: any) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
      url: task.url,
    }));
  } catch (error) {
    console.error("Error fetching ClickUp tasks:", error);
    return [];
  }
}
