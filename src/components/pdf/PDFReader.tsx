import { useState, useCallback } from "react";
import { Upload, FileText, X, Sparkles, Copy, Download } from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export function PDFReader() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setUploadedFile({
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
      });
      setSummary(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile({
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
      });
      setSummary(null);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setSummary(null);
  };

  const analyzeDocument = () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    // Simulated analysis
    setTimeout(() => {
      setSummary(`## Resumo do Documento: ${uploadedFile.name}

### Principais Pontos

1. **Objeto do Documento**: Trata-se de um instrumento contratual que estabelece as condições para prestação de serviços jurídicos especializados.

2. **Partes Envolvidas**: O documento identifica claramente as partes contratantes, estabelecendo suas qualificações e responsabilidades.

3. **Cláusulas Principais**:
   - Prazo de vigência: 12 meses a partir da assinatura
   - Forma de pagamento: mensal, com vencimento todo dia 5
   - Obrigações das partes detalhadamente especificadas

4. **Aspectos Jurídicos Relevantes**:
   - Cláusula de confidencialidade presente
   - Foro de eleição definido
   - Condições de rescisão estabelecidas

### Pontos de Atenção

⚠️ Verificar cláusula de multa rescisória
⚠️ Avaliar adequação do prazo de vigência
⚠️ Confirmar competência do foro eleito

### Sugestões

- Considerar inclusão de cláusula de reajuste anual
- Revisar termos de confidencialidade para maior abrangência`);
      setIsAnalyzing(false);
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
            <p className="text-muted-foreground">Envie documentos para análise e resumo com IA</p>
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
              <p className="text-muted-foreground text-sm mb-4">ou clique para selecionar</p>
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

          {/* Uploaded File */}
          {uploadedFile && (
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

              <button
                onClick={analyzeDocument}
                disabled={isAnalyzing}
                className="legal-button-gold w-full mt-4 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analisar com IA
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="legal-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-semibold">Resumo do Documento</h3>
            {summary && (
              <div className="flex gap-2">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {summary ? (
            <div className="prose prose-sm max-w-none fade-in">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {summary.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="font-serif text-lg font-semibold mt-0 mb-3">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="font-serif font-semibold mt-4 mb-2 text-gold-dark">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('⚠️')) {
                    return <p key={i} className="text-warning bg-warning/10 p-2 rounded my-1">{line}</p>;
                  }
                  if (line.startsWith('- ')) {
                    return <p key={i} className="ml-4 my-1">• {line.replace('- ', '')}</p>;
                  }
                  return <p key={i} className="my-1">{line}</p>;
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Envie um documento PDF para ver o resumo aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
