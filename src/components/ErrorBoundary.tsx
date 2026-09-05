import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro na aplicação:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="legal-card max-w-md w-full text-center space-y-4">
            <h1 className="font-serif text-2xl font-bold">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              Não conseguimos carregar esta tela. Tente novamente — se o problema continuar, nos avise.
            </p>
            <p className="text-xs text-muted-foreground break-words">
              {this.state.error.message}
            </p>
            <button
              className="legal-button-primary"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
