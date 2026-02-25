import React, { useState } from "react";
import { Monitor, ExternalLink, AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PromobEditor: React.FC = () => {
  const { toast } = useToast();
  const [attempted, setAttempted] = useState(false);

  const handleOpenPromob = () => {
    setAttempted(true);

    // Try custom protocol
    const link = document.createElement("a");
    link.href = "promob://open";
    link.click();

    toast({
      title: "Tentando abrir o Promob Plus…",
      description: "Se nada acontecer em alguns segundos, siga as instruções abaixo.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center space-y-6 max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Monitor className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Promob Plus</h2>
        <p className="text-muted-foreground text-sm">
          Clique no botão para tentar abrir o Promob Plus instalado neste computador.
        </p>
      </div>

      <Button size="lg" onClick={handleOpenPromob} className="gap-2 text-base px-8">
        <ExternalLink className="w-5 h-5" />
        Abrir Promob Plus
      </Button>

      {attempted && (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3 text-left bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Não abriu?</p>
              <p className="text-muted-foreground">
                Se o Promob Plus não abriu automaticamente, siga os passos:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Verifique se o <strong>Promob Plus</strong> está instalado neste computador.</li>
                <li>Abra o Promob manualmente pelo menu Iniciar ou atalho na área de trabalho.</li>
                <li>Se o problema persistir, reinstale o Promob ou entre em contato com o suporte.</li>
              </ol>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleOpenPromob} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-4">
        <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          O redirecionamento automático depende do Promob Plus estar instalado e configurado neste computador. Em alguns navegadores, pode ser necessário permitir a abertura de links externos.
        </span>
      </div>
    </div>
  );
};

export default PromobEditor;
