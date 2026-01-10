import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "hearing" | "deadline" | "meeting";
  location?: string;
}

const events: Event[] = [
  {
    id: "1",
    title: "Audiência de Conciliação",
    date: "2024-01-25",
    time: "14:00",
    type: "hearing",
    location: "5ª Vara Cível - Fórum Central",
  },
  {
    id: "2",
    title: "Prazo: Contestação",
    date: "2024-01-25",
    time: "23:59",
    type: "deadline",
  },
  {
    id: "3",
    title: "Reunião com Cliente",
    date: "2024-01-26",
    time: "10:00",
    type: "meeting",
    location: "Escritório",
  },
  {
    id: "4",
    title: "Audiência de Instrução",
    date: "2024-01-28",
    time: "09:30",
    type: "hearing",
    location: "2ª Vara Trabalhista",
  },
];

const eventTypeConfig = {
  hearing: { label: "Audiência", class: "bg-primary/10 text-primary border-l-primary" },
  deadline: { label: "Prazo", class: "bg-destructive/10 text-destructive border-l-destructive" },
  meeting: { label: "Reunião", class: "bg-success/10 text-success border-l-success" },
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 23));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasEvent = (day: number | null) => {
    if (!day) return false;
    const dateStr = `2024-01-${day.toString().padStart(2, "0")}`;
    return events.some((e) => e.date === dateStr);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `2024-01-${day.toString().padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="legal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold">Agenda</h2>
              <p className="text-muted-foreground">Compromissos e prazos</p>
            </div>
          </div>
          <button className="legal-button-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 legal-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl font-semibold">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`aspect-square p-2 rounded-lg text-center relative ${
                  day
                    ? "hover:bg-muted cursor-pointer transition-colors"
                    : ""
                } ${day === 23 ? "bg-primary text-primary-foreground" : ""}`}
              >
                {day && (
                  <>
                    <span className="text-sm">{day}</span>
                    {hasEvent(day) && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {getEventsForDay(day).slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.type === "hearing"
                                ? "bg-primary"
                                : event.type === "deadline"
                                ? "bg-destructive"
                                : "bg-success"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="legal-card">
          <h3 className="font-serif text-xl font-semibold mb-4">Próximos Eventos</h3>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border-l-4 ${eventTypeConfig[event.type].class} fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium">
                    {eventTypeConfig[event.type].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="font-medium text-sm mb-2">{event.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
