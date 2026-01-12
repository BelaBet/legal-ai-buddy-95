import { useState } from "react";
import { FolderOpen, Plus, Search, Filter, MoreVertical, Calendar, FileText, User, X } from "lucide-react";
import { useCases, useCreateCase, useDeleteCase, Case } from "@/hooks/useCases";
import { useDocuments } from "@/hooks/useDocuments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SyncToClickUpButton } from "@/components/integrations/SyncToClickUpButton";

const statusConfig = {
  active: { label: "Ativo", class: "bg-success/10 text-success" },
  pending: { label: "Pendente", class: "bg-warning/10 text-warning" },
  closed: { label: "Encerrado", class: "bg-muted text-muted-foreground" },
};

export function CasesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({ case_number: "", title: "", client: "", type: "Cível" });

  const { data: cases = [], isLoading } = useCases();
  const { data: documents = [] } = useDocuments();
  const createCase = useCreateCase();
  const deleteCase = useDeleteCase();

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_number.includes(searchTerm) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCase = async () => {
    if (!newCase.case_number || !newCase.title || !newCase.client) return;
    
    await createCase.mutateAsync(newCase);
    setNewCase({ case_number: "", title: "", client: "", type: "Cível" });
    setIsDialogOpen(false);
  };

  const getDocumentCount = (caseId: string) => {
    // In a real app, documents would be linked to cases
    return documents.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="legal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-light flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-gold-warm" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold">Gestão de Casos</h2>
              <p className="text-muted-foreground">Organize e acompanhe seus processos</p>
            </div>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="legal-button-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Caso
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="legal-card !p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, título ou cliente..."
              className="legal-input pl-10"
            />
          </div>
          <button className="legal-button-primary flex items-center gap-2 !bg-muted !text-foreground hover:!bg-muted/80">
            <Filter className="w-5 h-5" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Cases Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="legal-card animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-3" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="legal-card flex flex-col items-center justify-center h-48">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhum caso encontrado" : "Nenhum caso cadastrado"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 text-gold-warm hover:text-gold-dark transition-colors"
            >
              Cadastrar primeiro caso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCases.map((caseItem, index) => (
            <div
              key={caseItem.id}
              onClick={() => setSelectedCase(caseItem)}
              className={`document-card fade-in ${
                selectedCase?.id === caseItem.id ? "!border-gold-warm" : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[caseItem.status as keyof typeof statusConfig]?.class || statusConfig.active.class}`}>
                    {statusConfig[caseItem.status as keyof typeof statusConfig]?.label || caseItem.status}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{caseItem.type}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-muted rounded" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCase.mutate(caseItem.id);
                      }}
                      className="text-destructive"
                    >
                      Excluir caso
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h4 className="font-medium text-foreground mb-1">{caseItem.title}</h4>
              <p className="text-sm text-muted-foreground font-mono mb-4">{caseItem.case_number}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {caseItem.client}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <SyncToClickUpButton 
                    title={caseItem.title} 
                    description={`Caso: ${caseItem.case_number}\nCliente: ${caseItem.client}\nTipo: ${caseItem.type}`}
                    type="case"
                  />
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {getDocumentCount(caseItem.id)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(caseItem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Case Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Novo Caso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número do Processo</label>
              <input
                type="text"
                value={newCase.case_number}
                onChange={(e) => setNewCase({ ...newCase, case_number: e.target.value })}
                placeholder="0001234-56.2024.8.26.0100"
                className="legal-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <input
                type="text"
                value={newCase.title}
                onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                placeholder="Ação de Indenização por Danos Morais"
                className="legal-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cliente</label>
              <input
                type="text"
                value={newCase.client}
                onChange={(e) => setNewCase({ ...newCase, client: e.target.value })}
                placeholder="Nome do cliente"
                className="legal-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={newCase.type}
                onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                className="legal-input"
              >
                <option value="Cível">Cível</option>
                <option value="Trabalhista">Trabalhista</option>
                <option value="Família">Família</option>
                <option value="Criminal">Criminal</option>
                <option value="Tributário">Tributário</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>
            <button
              onClick={handleCreateCase}
              disabled={!newCase.case_number || !newCase.title || !newCase.client || createCase.isPending}
              className="legal-button-gold w-full disabled:opacity-50"
            >
              {createCase.isPending ? "Criando..." : "Criar Caso"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
