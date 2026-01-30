import { useState } from "react";
import { Plus, Search, FileText, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentCard } from "./DocumentCard";
import { DocumentDialog } from "./DocumentDialog";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("my-documents");

  const { data: documents, isLoading } = useDocuments();

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const documentTypes = [...new Set(documents?.map((d) => d.type) || [])];
  const documentStatuses = [...new Set(documents?.map((d) => d.status) || [])];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      completed: "Concluído",
      pending: "Pendente",
      archived: "Arquivado",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Meus Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e compartilhe seus documentos jurídicos
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Documento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-documents">Meus Documentos</TabsTrigger>
          <TabsTrigger value="shared-with-me">Compartilhados Comigo</TabsTrigger>
        </TabsList>

        <TabsContent value="my-documents" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {documentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Documents Grid/List */}
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={viewMode === "grid" ? "h-48" : "h-20"} />
              ))}
            </div>
          ) : filteredDocuments?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Crie seu primeiro documento clicando no botão acima"}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {filteredDocuments?.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode={viewMode}
                  isOwner={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared-with-me" className="space-y-4 mt-4">
          <SharedDocumentsList viewMode={viewMode} />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <DocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
      />
    </div>
  );
}

function SharedDocumentsList({ viewMode }: { viewMode: "grid" | "list" }) {
  const { data: documents, isLoading } = useDocuments();
  
  // Filter to show only shared documents (those where user is not the owner)
  // Since our hook returns all accessible documents, we'd need to check ownership
  // For now, showing message that shared documents appear here
  
  if (isLoading) {
    return (
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className={viewMode === "grid" ? "h-48" : "h-20"} />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground">Documentos Compartilhados</h3>
      <p className="text-muted-foreground mt-1">
        Documentos que outros usuários compartilharam com você aparecerão aqui
      </p>
    </div>
  );
}
