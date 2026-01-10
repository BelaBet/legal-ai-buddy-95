import { FileText, MoreVertical, Clock } from "lucide-react";

const documents = [
  {
    id: 1,
    title: "Contrato de Prestação de Serviços",
    type: "Contrato",
    date: "Hoje, 14:30",
    status: "Em edição",
  },
  {
    id: 2,
    title: "Petição Inicial - Processo 0001234",
    type: "Petição",
    date: "Ontem, 09:15",
    status: "Concluído",
  },
  {
    id: 3,
    title: "Recurso de Apelação",
    type: "Recurso",
    date: "22 Jan, 16:45",
    status: "Em revisão",
  },
  {
    id: 4,
    title: "Procuração Ad Judicia",
    type: "Procuração",
    date: "20 Jan, 11:00",
    status: "Concluído",
  },
];

const statusColors: Record<string, string> = {
  "Em edição": "bg-warning/10 text-warning",
  "Concluído": "bg-success/10 text-success",
  "Em revisão": "bg-primary/10 text-primary",
};

export function RecentDocuments() {
  return (
    <div className="legal-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl font-semibold">Documentos Recentes</h3>
        <button className="text-sm text-gold-warm hover:text-gold-dark transition-colors">
          Ver todos
        </button>
      </div>

      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div 
            key={doc.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
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
                  {doc.date}
                </span>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${statusColors[doc.status]}`}>
              {doc.status}
            </span>
            <button className="p-1 hover:bg-muted rounded">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
