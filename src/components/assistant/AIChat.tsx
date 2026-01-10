import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, BookOpen, Lightbulb, Scale, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: FileText, text: "Criar petição inicial" },
  { icon: BookOpen, text: "Resumir documento jurídico" },
  { icon: Lightbulb, text: "Quais são os prazos recursais?" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-chat`;

export function AIChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Sou o **LexIA**, seu assistente jurídico com inteligência artificial especializado em direito brasileiro.\n\nPosso ajudá-lo com:\n- 📄 Criação de petições, contratos e documentos\n- 📚 Resumos e análises de documentos jurídicos\n- ⚖️ Consultas sobre legislação e jurisprudência\n- 📅 Cálculo de prazos processuais\n- 💡 Sugestões e orientações legais\n\nComo posso ajudar?",
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

    let assistantContent = "";

    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("stream-")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: `stream-${Date.now()}`,
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      const allMessages = [...messages.filter(m => m.id !== "1"), userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Limite excedido",
            description: errorData.error || "Muitas requisições. Aguarde um momento.",
          });
          throw new Error("Rate limit exceeded");
        }
        
        if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Créditos insuficientes",
            description: errorData.error || "Adicione créditos para continuar usando.",
          });
          throw new Error("Payment required");
        }
        
        throw new Error("Failed to start stream");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            /* ignore partial leftovers */
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (assistantContent === "") {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('## ')) {
        return <h2 key={i} className="font-serif text-lg font-semibold mt-4 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="font-serif font-semibold mt-3 mb-1 text-gold-dark">{line.replace('### ', '')}</h3>;
      }
      // Bold
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Lists
      if (line.startsWith('- ')) {
        return <p key={i} className="ml-4 my-1" dangerouslySetInnerHTML={{ __html: '• ' + formatted.slice(2) }} />;
      }
      // Warning
      if (line.startsWith('⚠️')) {
        return <p key={i} className="text-warning bg-warning/10 p-2 rounded my-2">{line}</p>;
      }
      // Regular paragraph
      return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="legal-card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-warm to-gold-dark flex items-center justify-center">
            <Scale className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-semibold">Assistente Jurídico IA</h2>
            <p className="text-muted-foreground">Especializado em legislação e jurisprudência brasileira</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3 text-gold-warm" />
            IA Ativa
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
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {renderMarkdown(message.content)}
            </div>
            <span className="text-xs opacity-60 mt-2 block">
              {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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
            placeholder="Digite sua pergunta jurídica..."
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
