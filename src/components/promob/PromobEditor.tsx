import React from 'react';
import { ExternalLink, Monitor, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PromobEditor() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Monitor className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Promob Plus</h2>
          <p className="text-muted-foreground mt-2">
            Abra o Promob Plus instalado no seu notebook para criar e editar projetos 3D.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 text-lg py-6"
          onClick={() => {
            // Tenta abrir via protocolo customizado (se configurado)
            window.open('promob://', '_blank');
          }}
        >
          <ExternalLink className="w-5 h-5" />
          Abrir Promob Plus
        </Button>

        <div className="bg-muted rounded-xl p-4 text-left space-y-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Info className="w-4 h-4" /> Dica
          </p>
          <p className="text-sm text-muted-foreground">
            Se o botão não abrir automaticamente, abra o Promob Plus manualmente pelo ícone na área de trabalho do seu notebook.
          </p>
        </div>
      </Card>
    </div>
  );
}
