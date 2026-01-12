import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, Sparkles, Copy, Download, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
}

export function PDFReader() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    setIsExtracting(true);
    setExtractionProgress({ currentPage: 0, totalPages: 0 });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = "";

      setExtractionProgress({ currentPage: 0, totalPages: numPages });

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `\n--- Página ${i} ---\n${pageText}`;
        setExtractionProgress({ currentPage: i, totalPages: numPages });
      }

      return fullText.trim();
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw new Error("Erro ao extrair texto do PDF");
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Por favor, selecione apenas arquivos PDF");
      return;
    }

    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    });
    setSummary("");
    setExtractedText("");

    try {
      const text = await extractTextFromPDF(file);
      setExtractedText(text);
      toast.success(`PDF carregado! ${text.length} caracteres extraídos.`);
    } catch {
      toast.error("Erro ao processar o PDF. Verifique se o arquivo não está corrompido.");
      setUploadedFile(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploadedFile(null);
    setSummary("");
    setExtractedText("");
  };

  const analyzeDocument = async () => {
    if (!uploadedFile || !extractedText) return;

    setIsAnalyzing(true);
    setSummary("");

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Analise o seguinte documento PDF chamado "${uploadedFile.name}" e forneça:

1. **Resumo Executivo**: Uma síntese clara do documento
2. **Tipo de Documento**: Identifique se é contrato, petição, sentença, parecer, etc.
3. **Partes Envolvidas**: Liste as partes mencionadas
4. **Principais Cláusulas/Pontos**: Destaque os pontos mais importantes
5. **Aspectos Jurídicos Relevantes**: Fundamentos legais, artigos citados, jurisprudência
6. **Pontos de Atenção**: Cláusulas que merecem revisão ou atenção especial
7. **Sugestões**: Recomendações para o advogado

TEXTO DO DOCUMENTO:
${extractedText.substring(0, 30000)}${extractedText.length > 30000 ? "\n\n[... texto truncado por limite de caracteres ...]" : ""}`,
              },
            ],
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.status === 429) {
        toast.error("Limite de requisições atingido. Aguarde um momento.");
        setIsAnalyzing(false);
        return;
      }

      if (response.status === 402) {
        toast.error("Créditos insuficientes. Adicione mais créditos ao workspace.");
        setIsAnalyzing(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Erro na análise");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setSummary(fullResponse);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Analysis error:", error);
        toast.error("Erro ao analisar documento. Tente novamente.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary);
      toast.success("Resumo copiado!");
    }
  };

  const downloadSummary = () => {
    if (!summary || !uploadedFile) return;

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumo-${uploadedFile.name.replace(".pdf", "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resumo baixado!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="font-serif text-lg font-semibold mt-0 mb-3">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="font-serif font-semibold mt-4 mb-2 text-gold-dark">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("**") && line.includes("**:")) {
        const parts = line.split("**:");
        const title = parts[0].replace("**", "");
        const content = parts.slice(1).join("**:");
        return (
          <p key={i} className="my-1">
            <strong className="text-foreground">{title}:</strong>
            {content}
          </p>
        );
      }
      if (line.startsWith("⚠️") || line.includes("Atenção") || line.includes("ATENÇÃO")) {
        return (
          <p key={i} className="text-warning bg-warning/10 p-2 rounded my-1">
            {line}
          </p>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <p key={i} className="ml-4 my-1">
            {line}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <p key={i} className="ml-4 my-1">
            • {line.replace(/^[-•]\s/, "")}
          </p>
        );
      }
      return (
        <p key={i} className="my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="legal-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold">Leitor de PDF</h2>
            <p className="text-muted-foreground">
              Envie documentos para extração de texto e análise com IA jurídica
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`legal-card !p-8 border-2 border-dashed transition-all ${
              isDragging
                ? "border-gold-warm bg-gold-light/50"
                : "border-border hover:border-gold-warm/50"
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                <Upload className="w-8 h-8 text-gold-warm" />
              </div>
              <h3 className="font-medium text-lg mb-2">Arraste seu PDF aqui</h3>
              <p className="text-muted-foreground text-sm mb-4">
                ou clique para selecionar
              </p>
              <label className="legal-button-primary cursor-pointer inline-block">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                Selecionar Arquivo
              </label>
            </div>
          </div>

          {/* Extraction Progress */}
          {isExtracting && extractionProgress && (
            <div className="legal-card fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Extraindo texto...</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (extractionProgress.currentPage / extractionProgress.totalPages) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Página {extractionProgress.currentPage} de {extractionProgress.totalPages}
              </p>
            </div>
          )}

          {/* Uploaded File */}
          {uploadedFile && !isExtracting && (
            <div className="legal-card fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {extractedText && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {extractedText.length.toLocaleString()} caracteres extraídos
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={analyzeDocument}
                disabled={isAnalyzing || !extractedText}
                className="legal-button-gold w-full mt-4 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analisar com IA Jurídica
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted Text Preview */}
          {extractedText && !isExtracting && (
            <div className="legal-card">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Texto Extraído (Prévia)
              </h4>
              <div className="max-h-48 overflow-y-auto text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                <pre className="whitespace-pre-wrap font-sans">
                  {extractedText.substring(0, 2000)}
                  {extractedText.length > 2000 && "..."}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="legal-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-semibold">Análise do Documento</h3>
            {summary && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Copiar resumo"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={downloadSummary}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Baixar resumo"
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {isAnalyzing && !summary && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Analisando documento...</p>
            </div>
          )}

          {summary ? (
            <div className="prose prose-sm max-w-none fade-in max-h-[600px] overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {renderMarkdown(summary)}
              </div>
              {isAnalyzing && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </div>
          ) : (
            !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Envie um documento PDF para ver a análise jurídica aqui
                </p>
                <p className="text-sm text-muted-foreground/60 mt-2">
                  A IA irá identificar tipo, partes, cláusulas e pontos de atenção
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
