import { useState } from "react";
import { 
  useChecklists, 
  useDeleteChecklist,
  useUpdateChecklist,
  Checklist,
  ChecklistStatus 
} from "@/hooks/useChecklists";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Trash2,
  Eye,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChecklistDialog } from "./ChecklistDialog";
import { ChecklistDetailDialog } from "./ChecklistDetailDialog";
import { cn } from "@/lib/utils";

const statusConfig: Record<ChecklistStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  in_progress: { label: "Em Andamento", color: "bg-blue-500/10 text-blue-600", icon: Clock },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  overdue: { label: "Atrasado", color: "bg-red-500/10 text-red-600", icon: AlertTriangle },
  cancelled: { label: "Cancelado", color: "bg-gray-500/10 text-gray-600", icon: Archive },
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500/10 text-slate-600" },
  medium: { label: "Média", color: "bg-blue-500/10 text-blue-600" },
  high: { label: "Alta", color: "bg-orange-500/10 text-orange-600" },
  urgent: { label: "Urgente", color: "bg-red-500/10 text-red-600" },
};

export function ChecklistList() {
  const [statusFilter, setStatusFilter] = useState<ChecklistStatus | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  
  const { data: checklists = [], isLoading } = useChecklists(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const deleteChecklist = useDeleteChecklist();
  const updateChecklist = useUpdateChecklist();

  const getProgress = (checklist: Checklist) => {
    if (!checklist.items?.length) return 0;
    const completed = checklist.items.filter(item => item.is_completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const days = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) {
      return { text: `${Math.abs(days)} dias atrasado`, urgent: true };
    }
    if (isToday(date)) {
      return { text: "Vence hoje", urgent: true };
    }
    if (days <= 3) {
      return { text: `Vence em ${days} dias`, urgent: true };
    }
    return { text: format(date, "dd/MM/yyyy", { locale: ptBR }), urgent: false };
  };

  const handleStatusChange = (id: string, status: ChecklistStatus) => {
    updateChecklist.mutate({ 
      id, 
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ChecklistStatus | "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum checklist encontrado.<br />
              Crie um novo checklist ou use um template.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checklists.map((checklist) => {
            const progress = getProgress(checklist);
            const dueDateInfo = getDueDateInfo(checklist.due_date);
            const StatusIcon = statusConfig[checklist.status].icon;

            return (
              <Card 
                key={checklist.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedChecklist(checklist)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{checklist.title}</CardTitle>
                        <Badge className={priorityConfig[checklist.priority].color}>
                          {priorityConfig[checklist.priority].label}
                        </Badge>
                      </div>
                      {checklist.case && (
                        <p className="text-sm text-muted-foreground">
                          Processo: {checklist.case.case_number} - {checklist.case.title}
                        </p>
                      )}
                      {checklist.client_name && (
                        <p className="text-sm text-muted-foreground">
                          Cliente: {checklist.client_name}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChecklist(checklist);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(checklist.id, 'completed');
                          }}
                          disabled={checklist.status === 'completed'}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Marcar Concluído
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(checklist.id, 'cancelled');
                          }}
                          disabled={checklist.status === 'cancelled'}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChecklist.mutate(checklist.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge className={statusConfig[checklist.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[checklist.status].label}
                      </Badge>
                      {dueDateInfo && (
                        <span className={cn(
                          "flex items-center gap-1",
                          dueDateInfo.urgent && "text-destructive font-medium"
                        )}>
                          <Calendar className="w-4 h-4" />
                          {dueDateInfo.text}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {checklist.items?.filter(i => i.is_completed).length || 0}/{checklist.items?.length || 0} itens
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{progress}% concluído</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ChecklistDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />

      {selectedChecklist && (
        <ChecklistDetailDialog
          open={!!selectedChecklist}
          onOpenChange={(open) => !open && setSelectedChecklist(null)}
          checklistId={selectedChecklist.id}
        />
      )}
    </div>
  );
}
