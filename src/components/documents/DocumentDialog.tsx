import { useState, useEffect } from "react";
import { Loader2, Save, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Document, useCreateDocument, useUpdateDocument } from "@/hooks/useDocuments";

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "view";
  document?: Document;
}

const DOCUMENT_TYPES = [
  "Petição Inicial",
  "Contestação",
  "Recurso",
  "Contrato",
  "Parecer",
  "Procuração",
  "Acordo",
  "Notificação",
  "PDF Extraído",
  "Outro",
];

const DOCUMENT_STATUSES = [
  { value: "draft", label: "Rascunho" },
  { value: "pending", label: "Pendente" },
  { value: "completed", label: "Concluído" },
  { value: "archived", label: "Arquivado" },
];

export function DocumentDialog({ open, onOpenChange, mode, document }: DocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  const isLoading = createDocument.isPending || updateDocument.isPending;
  const isViewMode = mode === "view";

  useEffect(() => {
    if (document && (mode === "edit" || mode === "view")) {
      setTitle(document.title);
      setType(document.type);
      setContent(document.content || "");
      setStatus(document.status);
    } else if (mode === "create") {
      setTitle("");
      setType("");
      setContent("");
      setStatus("draft");
    }
  }, [document, mode, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !type) return;

    if (mode === "create") {
      await createDocument.mutateAsync({
        title: title.trim(),
        type,
        content: content.trim() || undefined,
        status,
      });
    } else if (mode === "edit" && document) {
      await updateDocument.mutateAsync({
        id: document.id,
        title: title.trim(),
        type,
        content: content.trim() || null,
        status,
      });
    }

    onOpenChange(false);
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Novo Documento";
      case "edit":
        return "Editar Documento";
      case "view":
        return "Visualizar Documento";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {getTitle()}
          </DialogTitle>
          {mode === "create" && (
            <DialogDescription>
              Preencha as informações para criar um novo documento
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Petição Inicial - Processo 1234"
                disabled={isViewMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={type} onValueChange={setType} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo do documento..."
                className="min-h-[200px] resize-y"
                disabled={isViewMode}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isViewMode ? "Fechar" : "Cancelar"}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit} disabled={isLoading || !title.trim() || !type}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === "create" ? "Criar" : "Salvar"}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
