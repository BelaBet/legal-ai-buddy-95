import { Calendar, AlertCircle } from "lucide-react";

const deadlines = [
  {
    id: 1,
    title: "Contestação - Processo 0005678",
    date: "25 Jan",
    daysLeft: 2,
    priority: "high",
  },
  {
    id: 2,
    title: "Audiência de Conciliação",
    date: "28 Jan",
    daysLeft: 5,
    priority: "medium",
  },
  {
    id: 3,
    title: "Entrega de Parecer",
    date: "30 Jan",
    daysLeft: 7,
    priority: "low",
  },
];

const priorityStyles: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-success bg-success/5",
};

export function UpcomingDeadlines() {
  return (
    <div className="legal-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl font-semibold">Próximos Prazos</h3>
        <button className="text-sm text-gold-warm hover:text-gold-dark transition-colors">
          Ver agenda
        </button>
      </div>

      <div className="space-y-4">
        {deadlines.map((deadline, index) => (
          <div 
            key={deadline.id}
            className={`p-4 rounded-lg border-l-4 ${priorityStyles[deadline.priority]} fade-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{deadline.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{deadline.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {deadline.daysLeft <= 3 && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={deadline.daysLeft <= 3 ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {deadline.daysLeft} dias
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
