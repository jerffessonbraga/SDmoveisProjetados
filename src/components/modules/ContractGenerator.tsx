import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, Download, Sparkles, Loader2, Eye, X } from 'lucide-react';
import jsPDF from 'jspdf';
import logoSrc from '@/assets/logo-sd.jpeg';

interface ContractGeneratorProps {
  templateType: 'contrato_servico' | 'ordem_servico';
  client?: { name: string; phone?: string; email?: string; address?: string };
  project?: { name?: string; value?: number; description?: string; deadline?: string };
  onClose: () => void;
}

const ContractGenerator: React.FC<ContractGeneratorProps> = ({ templateType, client, project, onClose }) => {
  const { toast } = useToast();
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const generateContract = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: {
          templateType,
          clientData: {
            nome_cliente: client?.name || '',
            telefone_cliente: client?.phone || '',
            email_cliente: client?.email || '',
            endereco_cliente: client?.address || '',
          },
          projectData: {
            nome_projeto: project?.name || '',
            valor_total: project?.value || 0,
            descricao: project?.description || '',
            prazo_entrega: project?.deadline || '',
          },
          customInstructions,
        },
      });

      if (error) throw error;

      const content = data?.content || '';
      setGeneratedContent(content);
      setEditableContent(content);
      toast({ title: '✅ Contrato gerado com sucesso!' });
    } catch (err: any) {
      console.error(err);
      toast({ title: '❌ Erro ao gerar contrato', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Add logo
    try {
      doc.addImage(logoSrc, 'JPEG', margin, 10, 30, 30);
    } catch (e) {
      // fallback if logo fails
    }

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SD MÓVEIS', margin + 35, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('RUA JORGE FIGUEREDO 740 - BARROCÃO - ITAITINGA-CE', margin + 35, 28);
    doc.text('(85) 98574-9686 | (85) 99760-2237 | CNPJ: 49.228.811/0001-33', margin + 35, 33);

    // Line separator
    doc.setDrawColor(200, 150, 50);
    doc.setLineWidth(0.8);
    doc.line(margin, 42, pageWidth - margin, 42);

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const title = templateType === 'ordem_servico' ? 'ORDEM DE SERVIÇO' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇO';
    doc.text(title, pageWidth / 2, 52, { align: 'center' });

    // Content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(editableContent || generatedContent, contentWidth);
    let y = 62;
    
    for (const line of lines) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
        // Add logo on new pages too
        try {
          doc.addImage(logoSrc, 'JPEG', pageWidth - margin - 20, 5, 15, 15);
        } catch (e) {}
      }
      
      // Bold for section headers (lines starting with numbers or all caps short lines)
      if (/^\d+\./.test(line.trim()) || (line.trim().length < 60 && line.trim() === line.trim().toUpperCase() && line.trim().length > 3)) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(line, margin, y);
      y += 5;
    }

    // Footer with signatures
    if (y < pageHeight - 50) {
      y = pageHeight - 45;
    } else {
      doc.addPage();
      y = 40;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 60, y);
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE', margin + 15, y + 5);
    doc.text('CONTRATADO - SD MÓVEIS', pageWidth - margin - 50, y + 5);

    const fileName = templateType === 'ordem_servico'
      ? `OS_${client?.name || 'cliente'}.pdf`
      : `Contrato_${client?.name || 'cliente'}.pdf`;
    doc.save(fileName);
    toast({ title: '📄 PDF baixado com sucesso!' });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex justify-between items-center">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <FileSignature className="w-5 h-5" />
          {templateType === 'ordem_servico' ? 'Gerar Ordem de Serviço' : 'Gerar Contrato de Serviço'}
        </h3>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-6 space-y-4">
        {/* Client/Project Info */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Cliente</p>
            <p className="font-bold text-gray-900">{client?.name || 'Não selecionado'}</p>
            <p className="text-sm text-gray-500">{client?.phone || ''}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Projeto</p>
            <p className="font-bold text-gray-900">{project?.name || 'Não definido'}</p>
            <p className="text-sm text-amber-600 font-bold">
              {project?.value ? `R$ ${project.value.toLocaleString('pt-BR')}` : ''}
            </p>
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
            Instruções adicionais para a IA (opcional)
          </label>
          <textarea
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            placeholder="Ex: Incluir ambientes: Suite Casal, Closet e Cozinha. Prazo de 60 dias. Entrada de 50%..."
            className="w-full p-3 rounded-xl border border-gray-200 text-sm"
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateContract}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? 'Gerando com IA...' : 'Gerar Contrato com IA'}
        </button>

        {/* Preview */}
        {(generatedContent || editableContent) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Eye className="w-4 h-4" /> Pré-visualização (editável)
              </p>
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </button>
            </div>

            {/* Preview with logo */}
            <div ref={previewRef} className="border border-gray-200 rounded-2xl p-6 bg-white max-h-[500px] overflow-auto shadow-inner">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-amber-400">
                <img src={logoSrc} alt="SD Móveis" className="w-16 h-16 object-contain rounded-lg" />
                <div>
                  <h2 className="font-black text-xl text-gray-900">SD MÓVEIS</h2>
                  <p className="text-xs text-gray-500">RUA JORGE FIGUEREDO 740 - BARROCÃO - ITAITINGA-CE</p>
                  <p className="text-xs text-gray-500">(85) 98574-9686 | CNPJ: 49.228.811/0001-33</p>
                </div>
              </div>
              <textarea
                value={editableContent}
                onChange={e => setEditableContent(e.target.value)}
                className="w-full min-h-[300px] text-sm font-mono leading-relaxed border-none outline-none resize-none bg-transparent"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractGenerator;
