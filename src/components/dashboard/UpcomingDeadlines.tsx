import { Calendar, AlertCircle } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityStyles: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-success bg-success/5",
};

export function UpcomingDeadlines() {
  const { data: events = [], isLoading } = useEvents();
  
  const today = new Date();
  const upcomingDeadlines = events
    .filter((e) => {
      const eventDate = new Date(e.event_date);
      return eventDate >= today;
    })
    .slice(0, 4)
    .map((e) => {
      const eventDate = new Date(e.event_date);
      const daysLeft = differenceInDays(eventDate, today);
      let priority: "high" | "medium" | "low" = "low";
      if (daysLeft <= 2) priority = "high";
      else if (daysLeft <= 5) priority = "medium";
      
      return { ...e, daysLeft, priority };
    });

  if (isLoading) {
    return (
      <div className="legal-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl font-semibold">Próximos Prazos</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border-l-4 border-muted bg-muted/30 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="legal-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl font-semibold">Próximos Prazos</h3>
        {events.length > 4 && (
          <button className="text-sm text-gold-warm hover:text-gold-dark transition-colors">
            Ver agenda
          </button>
        )}
      </div>

      {upcomingDeadlines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum prazo próximo</p>
          <p className="text-sm">Adicione eventos na agenda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingDeadlines.map((deadline, index) => (
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
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(deadline.event_date), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {deadline.daysLeft <= 3 && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={deadline.daysLeft <= 3 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {deadline.daysLeft === 0 ? "Hoje" : `${deadline.daysLeft} dias`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
