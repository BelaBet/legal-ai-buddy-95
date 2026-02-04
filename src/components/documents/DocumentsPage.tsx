import { useState, useMemo } from "react";
import { Plus, FileText, Grid, List } from "lucide-react";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentCard } from "./DocumentCard";
import { DocumentDialog } from "./DocumentDialog";
import { DocumentFilters, DocumentFiltersState } from "./DocumentFilters";
import { Skeleton } from "@/components/ui/skeleton";

const initialFilters: DocumentFiltersState = {
  searchTerm: "",
  typeFilter: "all",
  statusFilter: "all",
  createdFrom: undefined,
  createdTo: undefined,
  updatedFrom: undefined,
  updatedTo: undefined,
};

export function DocumentsPage() {
  const [filters, setFilters] = useState<DocumentFiltersState>(initialFilters);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("my-documents");

  const { data: documents, isLoading } = useDocuments();

  const documentTypes = useMemo(
    () => [...new Set(documents?.map((d) => d.type) || [])],
    [documents]
  );
  const documentStatuses = useMemo(
    () => [...new Set(documents?.map((d) => d.status) || [])],
    [documents]
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      completed: "Concluído",
      pending: "Pendente",
      archived: "Arquivado",
    };
    return labels[status] || status;
  };

  const filteredDocuments = useMemo(() => {
    return documents?.filter((doc) => {
      // Text search
      const matchesSearch =
        doc.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        filters.typeFilter === "all" || doc.type === filters.typeFilter;

      // Status filter
      const matchesStatus =
        filters.statusFilter === "all" || doc.status === filters.statusFilter;

      // Created date filter
      const docCreatedAt = parseISO(doc.created_at);
      const matchesCreatedFrom =
        !filters.createdFrom ||
        docCreatedAt >= startOfDay(filters.createdFrom);
      const matchesCreatedTo =
        !filters.createdTo || docCreatedAt <= endOfDay(filters.createdTo);

      // Updated date filter
      const docUpdatedAt = parseISO(doc.updated_at);
      const matchesUpdatedFrom =
        !filters.updatedFrom ||
        docUpdatedAt >= startOfDay(filters.updatedFrom);
      const matchesUpdatedTo =
        !filters.updatedTo || docUpdatedAt <= endOfDay(filters.updatedTo);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCreatedFrom &&
        matchesCreatedTo &&
        matchesUpdatedFrom &&
        matchesUpdatedTo
      );
    });
  }, [documents, filters]);

  const hasActiveFilters =
    filters.searchTerm ||
    filters.typeFilter !== "all" ||
    filters.statusFilter !== "all" ||
    filters.createdFrom ||
    filters.createdTo ||
    filters.updatedFrom ||
    filters.updatedTo;

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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <DocumentFilters
                filters={filters}
                onFiltersChange={setFilters}
                documentTypes={documentTypes}
                documentStatuses={documentStatuses}
                getStatusLabel={getStatusLabel}
              />
              <div className="flex border rounded-md ml-4">
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
                {hasActiveFilters
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
