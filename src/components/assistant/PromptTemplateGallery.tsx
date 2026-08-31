import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROMPT_TEMPLATES, PROMPT_TEMPLATE_CATEGORIES } from "@/lib/promptTemplates";

interface PromptTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (prompt: string) => void;
}

export function PromptTemplateGallery({ open, onOpenChange, onSelectTemplate }: PromptTemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PROMPT_TEMPLATES.filter((template) => {
      const matchesCategory = !activeCategory || template.category === activeCategory;
      const matchesSearch =
        !query ||
        template.title.toLowerCase().includes(query) ||
        template.prompt.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const handleSelect = (prompt: string) => {
    onSelectTemplate(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Sparkles className="w-5 h-5 text-gold-warm" />
            Templates de prompts
          </DialogTitle>
          <DialogDescription>
            Escolha um ponto de partida para diferentes tipos de documentos e consultas jurídicas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar template..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => setActiveCategory(null)}
            >
              Todos
            </Badge>
            {PROMPT_TEMPLATE_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => setActiveCategory((current) => (current === category ? null : category))}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[360px] pr-2 -mr-2">
          <div className="space-y-2 py-1">
            {filteredTemplates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum template encontrado para essa busca.
              </p>
            )}
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template.prompt)}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-gold-warm hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm">{template.title}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.prompt}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
