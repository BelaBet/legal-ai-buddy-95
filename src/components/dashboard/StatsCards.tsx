import { FileText, FolderOpen, Clock, CheckCircle } from "lucide-react";

const stats = [
  {
    label: "Documentos",
    value: "24",
    icon: FileText,
    change: "+3 esta semana",
    color: "text-primary",
  },
  {
    label: "Casos Ativos",
    value: "8",
    icon: FolderOpen,
    change: "2 atualizados hoje",
    color: "text-gold-warm",
  },
  {
    label: "Prazos Próximos",
    value: "5",
    icon: Clock,
    change: "Próximo: 2 dias",
    color: "text-warning",
  },
  {
    label: "Concluídos",
    value: "156",
    icon: CheckCircle,
    change: "Este mês: 12",
    color: "text-success",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="stat-card fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {stat.change}
            </span>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
