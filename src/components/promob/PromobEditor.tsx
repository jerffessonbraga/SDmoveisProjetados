import React from "react";
import { Monitor, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PromobEditorProps {
  onRender?: () => void;
  isRendering?: boolean;
}

const PromobEditor: React.FC<PromobEditorProps> = ({ onRender, isRendering }) => {
  const { toast } = useToast();

  const handleOpenPromob = () => {
    window.location.href = "promob://open";
    toast({
      title: "Abrindo Promob Plus",
      description: "O Promob Plus será aberto na sua máquina. Caso não abra, verifique se está instalado.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Monitor className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">Promob Plus</h2>
        <p className="text-muted-foreground">
          Clique no botão abaixo para abrir o Promob Plus instalado no seu computador e trabalhar no projeto.
        </p>
      </div>

      <Button size="lg" onClick={handleOpenPromob} className="gap-2 text-base px-8">
        <ExternalLink className="w-5 h-5" />
        Abrir Promob Plus
      </Button>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-4 max-w-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>O Promob Plus precisa estar instalado neste computador para que o redirecionamento funcione.</span>
      </div>
    </div>
  );
};

export default PromobEditor;
