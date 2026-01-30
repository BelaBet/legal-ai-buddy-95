import { useState, useEffect } from "react";
import { Search, Share2, X, Loader2, User, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Document } from "@/hooks/useDocuments";
import {
  useDocumentShares,
  useSearchUsersForSharing,
  useShareDocument,
  useRemoveShare,
  SearchedUser,
} from "@/hooks/useDocumentSharing";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
}

export function ShareDialog({ open, onOpenChange, document }: ShareDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [permission, setPermission] = useState<"view" | "edit">("view");

  const { data: shares, isLoading: sharesLoading } = useDocumentShares(document.id);
  const searchUsers = useSearchUsersForSharing();
  const shareDocument = useShareDocument();
  const removeShare = useRemoveShare();

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedUser(null);
      setPermission("view");
    }
  }, [open]);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        const results = await searchUsers.mutateAsync(searchTerm);
        // Filter out users that already have access
        const sharedUserIds = shares?.map((s) => s.shared_with) || [];
        setSearchResults(results.filter((u) => !sharedUserIds.includes(u.user_id)));
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, shares]);

  const handleShare = async () => {
    if (!selectedUser) return;

    await shareDocument.mutateAsync({
      documentId: document.id,
      sharedWith: selectedUser.user_id,
      permission,
    });

    setSelectedUser(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveShare = async (shareId: string) => {
    await removeShare.mutateAsync({ shareId, documentId: document.id });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartilhar Documento
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{document.title}" com outros usuários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Users */}
          <div className="space-y-2">
            <Label>Buscar usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do usuário..."
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchTerm(user.full_name || "");
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.full_name}</span>
                  </button>
                ))}
              </div>
            )}

            {searchUsers.isPending && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.full_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedUser(null);
                  setSearchTerm("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Permission Select */}
          {selectedUser && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Apenas visualizar</SelectItem>
                    <SelectItem value="edit">Pode editar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleShare} disabled={shareDocument.isPending}>
                {shareDocument.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span className="ml-2">Compartilhar</span>
              </Button>
            </div>
          )}

          {/* Current Shares */}
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-muted-foreground">Compartilhado com</Label>
            {sharesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : shares?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este documento ainda não foi compartilhado
              </p>
            ) : (
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {shares?.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Usuário compartilhado
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {share.permission === "edit" ? "Editar" : "Ver"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveShare(share.id)}
                        disabled={removeShare.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
