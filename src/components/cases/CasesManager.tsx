import { useState } from "react";
import { FolderOpen, Plus, Search, Filter, MoreVertical, Calendar, FileText, User } from "lucide-react";

interface Case {
  id: string;
  number: string;
  title: string;
  client: string;
  status: "active" | "pending" | "closed";
  type: string;
  date: string;
  documents: number;
}

const cases: Case[] = [
  {
    id: "1",
    number: "0001234-56.2024.8.26.0100",
    title: "Ação de Indenização por Danos Morais",
    client: "Maria Silva",
    status: "active",
    type: "Cível",
    date: "15/01/2024",
    documents: 12,
  },
  {
    id: "2",
    number: "0005678-90.2024.8.26.0100",
    title: "Reclamação Trabalhista",
    client: "João Santos",
    status: "pending",
    type: "Trabalhista",
    date: "10/01/2024",
    documents: 8,
  },
  {
    id: "3",
    number: "0009012-34.2023.8.26.0100",
    title: "Execução de Título Extrajudicial",
    client: "Empresa ABC Ltda",
    status: "active",
    type: "Cível",
    date: "20/12/2023",
    documents: 15,
  },
  {
    id: "4",
    number: "0003456-78.2023.8.26.0100",
    title: "Ação de Divórcio Consensual",
    client: "Pedro e Ana Costa",
    status: "closed",
    type: "Família",
    date: "05/12/2023",
    documents: 6,
  },
];

const statusConfig = {
  active: { label: "Ativo", class: "bg-success/10 text-success" },
  pending: { label: "Pendente", class: "bg-warning/10 text-warning" },
  closed: { label: "Encerrado", class: "bg-muted text-muted-foreground" },
};

export function CasesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.number.includes(searchTerm) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button className="legal-button-primary flex items-center gap-2">
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
                <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[caseItem.status].class}`}>
                  {statusConfig[caseItem.status].label}
                </span>
                <span className="text-xs text-muted-foreground ml-2">{caseItem.type}</span>
              </div>
              <button className="p-1 hover:bg-muted rounded">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <h4 className="font-medium text-foreground mb-1">{caseItem.title}</h4>
            <p className="text-sm text-muted-foreground font-mono mb-4">{caseItem.number}</p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {caseItem.client}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {caseItem.documents}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {caseItem.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="legal-card flex flex-col items-center justify-center h-48">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum caso encontrado</p>
        </div>
      )}
    </div>
  );
}
