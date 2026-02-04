import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export interface DocumentFiltersState {
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
  createdFrom: Date | undefined;
  createdTo: Date | undefined;
  updatedFrom: Date | undefined;
  updatedTo: Date | undefined;
}

interface DocumentFiltersProps {
  filters: DocumentFiltersState;
  onFiltersChange: (filters: DocumentFiltersState) => void;
  documentTypes: string[];
  documentStatuses: string[];
  getStatusLabel: (status: string) => string;
}

export function DocumentFilters({
  filters,
  onFiltersChange,
  documentTypes,
  documentStatuses,
  getStatusLabel,
}: DocumentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof DocumentFiltersState>(
    key: K,
    value: DocumentFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearDateFilters = () => {
    onFiltersChange({
      ...filters,
      createdFrom: undefined,
      createdTo: undefined,
      updatedFrom: undefined,
      updatedTo: undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: "",
      typeFilter: "all",
      statusFilter: "all",
      createdFrom: undefined,
      createdTo: undefined,
      updatedFrom: undefined,
      updatedTo: undefined,
    });
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.typeFilter !== "all" ||
    filters.statusFilter !== "all" ||
    filters.createdFrom ||
    filters.createdTo ||
    filters.updatedFrom ||
    filters.updatedTo;

  const activeDateFiltersCount = [
    filters.createdFrom,
    filters.createdTo,
    filters.updatedFrom,
    filters.updatedTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.typeFilter}
            onValueChange={(v) => updateFilter("typeFilter", v)}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.statusFilter}
            onValueChange={(v) => updateFilter("statusFilter", v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {documentStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced filters toggle */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros Avançados
              {activeDateFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeDateFiltersCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            {/* Created date filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Data de Criação
              </label>
              <div className="flex flex-wrap gap-2">
                <DatePickerFilter
                  label="De"
                  date={filters.createdFrom}
                  onDateChange={(d) => updateFilter("createdFrom", d)}
                />
                <DatePickerFilter
                  label="Até"
                  date={filters.createdTo}
                  onDateChange={(d) => updateFilter("createdTo", d)}
                />
              </div>
            </div>

            {/* Updated date filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Data de Modificação
              </label>
              <div className="flex flex-wrap gap-2">
                <DatePickerFilter
                  label="De"
                  date={filters.updatedFrom}
                  onDateChange={(d) => updateFilter("updatedFrom", d)}
                />
                <DatePickerFilter
                  label="Até"
                  date={filters.updatedTo}
                  onDateChange={(d) => updateFilter("updatedTo", d)}
                />
              </div>
            </div>

            {activeDateFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilters}
                className="gap-1"
              >
                <X className="w-3 h-3" />
                Limpar filtros de data
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface DatePickerFilterProps {
  label: string;
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

function DatePickerFilter({ label, date, onDateChange }: DatePickerFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[160px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          locale={ptBR}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
