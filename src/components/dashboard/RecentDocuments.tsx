import { useState } from "react";
import { FileText, MoreVertical, Clock, Eye, Pencil, Trash2 } from "lucide-react";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  "draft": "bg-warning/10 text-warning",
  "completed": "bg-success/10 text-success",
  "review": "bg-primary/10 text-primary",
};

const statusLabels: Record<string, string> = {
  "draft": "Em edição",
  "completed": "Concluído",
  "review": "Em revisão",
};

export function RecentDocuments() {
  const { data: documents = [], isLoading } = useDocuments();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const recentDocs = documents.slice(0, 4);

  const handleOpenDocument = (doc: Document, mode: "view" | "edit") => {
    setDialogMode(mode);
    setSelectedDocument(doc);
  };

  if (isLoading) {
    return (
      <div className="legal-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl font-semibold">Documentos Recentes</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="legal-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl font-semibold">Documentos Recentes</h3>
        {documents.length > 4 && (
          <button className="text-sm text-gold-warm hover:text-gold-dark transition-colors">
            Ver todos
          </button>
        )}
      </div>

      {recentDocs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum documento ainda</p>
          <p className="text-sm">Crie seu primeiro documento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentDocs.map((doc, index) => (
            <div 
              key={doc.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleOpenDocument(doc, "view")}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{doc.type}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${statusColors[doc.status] || statusColors.draft}`}>
                {statusLabels[doc.status] || doc.status}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDocument(doc, "view");
                  }}>
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDocument(doc, "edit");
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocumentToDelete(doc);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <DocumentDialog
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
        mode={dialogMode}
        document={selectedDocument}
      />

      {documentToDelete && (
        <DeleteDocumentDialog
          open={!!documentToDelete}
          onOpenChange={(open) => !open && setDocumentToDelete(null)}
          document={documentToDelete}
        />
      )}
    </div>
  );
}
