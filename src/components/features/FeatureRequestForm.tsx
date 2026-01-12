import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Lightbulb, Loader2, Send, Clock, DollarSign, Tag, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categories = [
  { value: "automation", label: "Automação de Processos" },
  { value: "ai", label: "Inteligência Artificial" },
  { value: "integration", label: "Integração com Sistemas" },
  { value: "document", label: "Gestão de Documentos" },
  { value: "report", label: "Relatórios e Analytics" },
  { value: "mobile", label: "Aplicativo Mobile" },
  { value: "other", label: "Outro" },
];

const priorities = [
  { value: "low", label: "Baixa", color: "bg-slate-500" },
  { value: "normal", label: "Normal", color: "bg-blue-500" },
  { value: "high", label: "Alta", color: "bg-orange-500" },
  { value: "urgent", label: "Urgente", color: "bg-red-500" },
];

const budgetRanges = [
  { value: "up-to-500", label: "Até R$ 500" },
  { value: "500-1000", label: "R$ 500 - R$ 1.000" },
  { value: "1000-2500", label: "R$ 1.000 - R$ 2.500" },
  { value: "2500-5000", label: "R$ 2.500 - R$ 5.000" },
  { value: "5000-10000", label: "R$ 5.000 - R$ 10.000" },
  { value: "above-10000", label: "Acima de R$ 10.000" },
  { value: "negotiable", label: "A negociar" },
];

export function FeatureRequestForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "normal",
    expected_deadline: "",
    budget_range: "",
  });

  // Fetch user's feature requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["feature-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createRequest = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("feature_requests").insert({
        user_id: user?.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        expected_deadline: data.expected_deadline || null,
        budget_range: data.budget_range || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      toast.success("Solicitação enviada com sucesso!", {
        description: "Nossa equipe analisará sua solicitação em breve.",
      });
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "normal",
        expected_deadline: "",
        budget_range: "",
      });
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar solicitação", {
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    await createRequest.mutateAsync(formData);
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
      case "in_review":
        return <Badge className="bg-blue-500 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Em Análise</Badge>;
      case "approved":
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Recusado</Badge>;
      case "completed":
        return <Badge className="bg-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (value: string) => {
    return categories.find((c) => c.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Solicitar Nova Funcionalidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Descreva a funcionalidade que você precisa e nossa equipe entrará em contato
        </p>
      </div>

      {/* Alert about costs */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Sobre os Custos de Desenvolvimento
              </h3>
              <p className="text-sm text-muted-foreground">
                O desenvolvimento de novas funcionalidades inclui custos que serão cobrados conforme a 
                complexidade do projeto. Após análise da sua solicitação, nossa equipe enviará um 
                orçamento detalhado com prazo estimado e valor para aprovação antes de iniciar o desenvolvimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Nova Solicitação
            </CardTitle>
            <CardDescription>
              Preencha os detalhes da funcionalidade desejada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Funcionalidade *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Integração com Tribunais"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o que você precisa, como essa funcionalidade ajudaria no seu trabalho, e quaisquer requisitos específicos..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${pri.color}`} />
                            {pri.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_deadline">Prazo Desejado</Label>
                  <Input
                    id="expected_deadline"
                    type="date"
                    value={formData.expected_deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expected_deadline: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_range">Faixa de Orçamento</Label>
                  <Select
                    value={formData.budget_range}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, budget_range: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((budget) => (
                        <SelectItem key={budget.value} value={budget.value}>
                          {budget.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Minhas Solicitações
            </CardTitle>
            <CardDescription>Acompanhe o status das suas solicitações</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{request.title}</h4>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {request.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {getCategoryLabel(request.category)}
                      </span>
                      <span>
                        {format(new Date(request.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {request.estimated_cost && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs flex items-center gap-1 text-green-600">
                          <DollarSign className="w-3 h-3" />
                          Orçamento: R$ {Number(request.estimated_cost).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    )}
                    {request.admin_notes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          <strong>Resposta:</strong> {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Você ainda não fez nenhuma solicitação</p>
                <p className="text-xs mt-1">Preencha o formulário ao lado para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
