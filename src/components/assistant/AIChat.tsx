import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, BookOpen, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: FileText, text: "Criar petição inicial" },
  { icon: BookOpen, text: "Resumir documento" },
  { icon: Lightbulb, text: "Sugestões para o caso" },
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Sou seu assistente jurídico com IA. Posso ajudá-lo a criar documentos, fazer resumos, dar sugestões legais e muito mais. Como posso ajudar?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulated AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getSimulatedResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("petição") || lowerQuery.includes("criar")) {
      return "Posso ajudá-lo a criar uma petição. Para começar, preciso de algumas informações:\n\n1. **Tipo de ação**: Qual é a natureza da demanda?\n2. **Partes envolvidas**: Quem é o autor e o réu?\n3. **Fatos principais**: Qual é o contexto do caso?\n\nCom essas informações, posso gerar um modelo estruturado para você revisar.";
    }
    
    if (lowerQuery.includes("resumo") || lowerQuery.includes("resumir")) {
      return "Para fazer um resumo, você pode:\n\n1. **Enviar o PDF** na aba 'Leitor PDF'\n2. **Colar o texto** diretamente aqui\n\nFarei uma análise completa destacando os pontos principais, argumentos centrais e conclusões do documento.";
    }
    
    if (lowerQuery.includes("prazo") || lowerQuery.includes("recurso")) {
      return "Sobre prazos recursais:\n\n• **Apelação**: 15 dias úteis (CPC, art. 1.003)\n• **Agravo de Instrumento**: 15 dias úteis\n• **Embargos de Declaração**: 5 dias úteis\n• **Recurso Especial/Extraordinário**: 15 dias úteis\n\nLembre-se: os prazos são contados em dias úteis, excluindo-se o dia do começo e incluindo-se o do vencimento.";
    }

    return "Entendi sua solicitação. Para fornecer uma resposta mais precisa, poderia me dar mais detalhes sobre o contexto do caso ou documento que você está trabalhando? Assim posso oferecer orientações mais específicas e úteis.";
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="legal-card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-warm to-gold-dark flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold">Assistente Jurídico IA</h2>
            <p className="text-muted-foreground">Tire dúvidas, crie documentos e obtenha sugestões</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-message ${message.role} fade-in`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <span className="text-xs opacity-60 mt-2 block">
              {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="ai-message assistant fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gold-warm rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gold-warm rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-gold-warm rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.text)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent hover:bg-accent/80 transition-colors whitespace-nowrap"
            >
              <suggestion.icon className="w-4 h-4 text-gold-warm" />
              <span className="text-sm font-medium">{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="legal-card !p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua pergunta ou solicitação..."
            className="legal-input flex-1"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="legal-button-gold !px-4 !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
