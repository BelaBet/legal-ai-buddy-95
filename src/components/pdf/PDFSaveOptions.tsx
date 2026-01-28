import { useState } from "react";
import { Save, FileText, Calendar, Download, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateDocument } from "@/hooks/useDocuments";
import { toast } from "sonner";

interface PDFSaveOptionsProps {
  extractedText: string;
  summary: string;
  fileName: string;
  disabled?: boolean;
}

export function PDFSaveOptions({ 
  extractedText, 
  summary, 
  fileName, 
  disabled = false 
}: PDFSaveOptionsProps) {
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [eventTime, setEventTime] = useState("09:00");
  const [isSaving, setIsSaving] = useState(false);

  const createDocument = useCreateDocument();

  const getContentToSave = () => {
    let content = "";
    if (summary) {
      content += "=== ANÁLISE DO DOCUMENTO ===\n\n" + summary + "\n\n";
    }
    if (extractedText) {
      content += "=== TEXTO EXTRAÍDO ===\n\n" + extractedText;
    }
    return content;
  };

  const handleSaveToDocuments = async () => {
    if (!documentTitle.trim()) {
      toast.error("Digite um título para o documento");
      return;
    }

    setIsSaving(true);
    try {
      await createDocument.mutateAsync({
        title: documentTitle.trim(),
        type: "PDF Extraído",
        content: getContentToSave(),
        status: "completed",
      });
      setShowDocumentDialog(false);
      setDocumentTitle("");
      toast.success("Documento salvo com sucesso!");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Erro ao salvar documento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToEvent = async () => {
    if (!eventTitle.trim()) {
      toast.error("Digite um título para o evento");
      return;
    }

    setIsSaving(true);
    try {
      // Create a text file blob to be used as attachment
      const textContent = getContentToSave();
      const blob = new Blob([textContent], { type: "text/plain" });
      const file = new File([blob], `${fileName.replace(".pdf", "")}-texto.txt`, { 
        type: "text/plain" 
      });

      // Import useCreateEvent dynamically
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create the event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          title: eventTitle.trim(),
          description: `Texto extraído do arquivo: ${fileName}`,
          event_date: eventDate,
          event_time: eventTime,
          type: "meeting",
          user_id: user.id,
          notification_enabled: false,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Upload the file as attachment
      const filePath = `${user.id}/${event.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("event-files")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
      } else {
        // Create attachment record
        await supabase
          .from("event_attachments")
          .insert({
            event_id: event.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
          });
      }

      setShowEventDialog(false);
      setEventTitle("");
      toast.success("Evento criado com anexo!");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erro ao criar evento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const content = getContentToSave();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(".pdf", "")}-texto-extraido.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  const openDocumentDialog = () => {
    setDocumentTitle(fileName.replace(".pdf", ""));
    setShowDocumentDialog(true);
  };

  const openEventDialog = () => {
    setEventTitle(`Documento: ${fileName.replace(".pdf", "")}`);
    setShowEventDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={disabled || (!extractedText && !summary)}
            className="legal-button-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Dados
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Escolha onde salvar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openDocumentDialog} className="cursor-pointer">
            <FileText className="w-4 h-4 mr-2" />
            Salvar em Documentos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openEventDialog} className="cursor-pointer">
            <Calendar className="w-4 h-4 mr-2" />
            Adicionar à Agenda
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Fazer Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog: Save to Documents */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar em Documentos</DialogTitle>
            <DialogDescription>
              O texto extraído e a análise serão salvos como um novo documento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Título do Documento</Label>
              <Input
                id="doc-title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Será salvo:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {summary && <li>Análise do documento</li>}
                {extractedText && <li>Texto extraído ({extractedText.length.toLocaleString()} caracteres)</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveToDocuments} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add to Event */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à Agenda</DialogTitle>
            <DialogDescription>
              Crie um evento na agenda com o texto extraído como anexo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Título do Evento</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Ex: Revisar contrato XYZ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Data</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Hora</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Anexo que será adicionado:</p>
              <p className="text-xs">{fileName.replace(".pdf", "")}-texto.txt</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddToEvent} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Criar Evento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
