import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Eye,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Document } from "@/hooks/useDocuments";
import { DocumentDialog } from "./DocumentDialog";
import { ShareDialog } from "./ShareDialog";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";

interface DocumentCardProps {
  document: Document;
  viewMode: "grid" | "list";
  isOwner: boolean;
  ownerName?: string;
}

export function DocumentCard({ document, viewMode, isOwner, ownerName }: DocumentCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      completed: "bg-green-500/10 text-green-600 border-green-500/20",
      pending: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      archived: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-600";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      completed: "Concluído",
      pending: "Pendente",
      archived: "Arquivado",
    };
    return labels[status] || status;
  };

  const getTypeIcon = (type: string) => {
    // Could expand with different icons per type
    return <FileText className="w-5 h-5" />;
  };

  if (viewMode === "list") {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {getTypeIcon(document.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{document.title}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{document.type}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(document.updated_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                  {!isOwner && ownerName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ownerName}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(document.status)}>
                {getStatusLabel(document.status)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <DocumentDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          mode="view"
          document={document}
        />
        <DocumentDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          mode="edit"
          document={document}
        />
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          document={document}
        />
        <DeleteDocumentDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          document={document}
        />
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {getTypeIcon(document.type)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-medium text-foreground line-clamp-2">{document.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{document.type}</p>
          </div>
          {document.content && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {document.content.substring(0, 100)}...
            </p>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant="outline" className={getStatusColor(document.status)}>
              {getStatusLabel(document.status)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {format(new Date(document.updated_at), "dd/MM/yy", { locale: ptBR })}
            </div>
          </div>
          {!isOwner && ownerName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              Criado por: {ownerName}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        mode="view"
        document={document}
      />
      <DocumentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mode="edit"
        document={document}
      />
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        document={document}
      />
      <DeleteDocumentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        document={document}
      />
    </>
  );
}
