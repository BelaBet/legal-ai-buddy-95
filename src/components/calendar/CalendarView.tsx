import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, X } from "lucide-react";
import { useEvents, useCreateEvent, useDeleteEvent, CalendarEvent } from "@/hooks/useEvents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    event_date: format(new Date(), "yyyy-MM-dd"),
    event_time: "09:00",
    type: "meeting",
    location: "",
  });

  const { data: events = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    const startDay = getDay(start);
    const paddedDays: (Date | null)[] = [];
    
    for (let i = 0; i < startDay; i++) {
      paddedDays.push(null);
    }
    
    return [...paddedDays, ...days];
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => isSameDay(new Date(e.event_date), day));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_date || !newEvent.event_time) return;
    
    await createEvent.mutateAsync(newEvent);
    setNewEvent({
      title: "",
      event_date: format(new Date(), "yyyy-MM-dd"),
      event_time: "09:00",
      type: "meeting",
      location: "",
    });
    setIsDialogOpen(false);
  };

  const days = getDaysInMonth();

  const today = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= today)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5);

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
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="legal-button-primary flex items-center gap-2"
          >
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
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isCurrentDay = day && isToday(day);
              
              return (
                <div
                  key={index}
                  className={`aspect-square p-2 rounded-lg text-center relative ${
                    day ? "hover:bg-muted cursor-pointer transition-colors" : ""
                  } ${isCurrentDay ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {day && (
                    <>
                      <span className="text-sm">{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, i) => (
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
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="legal-card">
          <h3 className="font-serif text-xl font-semibold mb-4">Próximos Eventos</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border-l-4 border-muted bg-muted/30 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum evento agendado</p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 text-gold-warm hover:text-gold-dark transition-colors"
              >
                Agendar primeiro evento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 ${eventTypeConfig[event.type as keyof typeof eventTypeConfig]?.class || eventTypeConfig.meeting.class} fade-in group relative`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => deleteEvent.mutate(event.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium">
                      {eventTypeConfig[event.type as keyof typeof eventTypeConfig]?.label || event.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-2">{event.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.event_time}
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
          )}
        </div>
      </div>

      {/* New Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Audiência de Conciliação"
                className="legal-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  className="legal-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Horário</label>
                <input
                  type="time"
                  value={newEvent.event_time}
                  onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                  className="legal-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="legal-input"
              >
                <option value="meeting">Reunião</option>
                <option value="hearing">Audiência</option>
                <option value="deadline">Prazo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Local (opcional)</label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Fórum, escritório..."
                className="legal-input"
              />
            </div>
            <button
              onClick={handleCreateEvent}
              disabled={!newEvent.title || createEvent.isPending}
              className="legal-button-gold w-full disabled:opacity-50"
            >
              {createEvent.isPending ? "Criando..." : "Criar Evento"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
