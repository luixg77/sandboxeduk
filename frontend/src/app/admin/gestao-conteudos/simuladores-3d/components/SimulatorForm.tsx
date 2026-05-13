'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateSimulator, useUpdateSimulator, Simulator } from '@/hooks/useSimulators';
import { ArrowLeft, Save, UploadCloud, X, Cuboid, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface SimulatorFormProps {
  initialData?: Simulator;
  isEdit?: boolean;
}

export function SimulatorForm({ initialData, isEdit = false }: SimulatorFormProps) {
  const router = useRouter();
  const createMutation = useCreateSimulator();
  const updateMutation = useUpdateSimulator();

  const [formData, setFormData] = useState<Partial<Simulator>>({
    title: '',
    iframe_url: '',
    knowledge_area: '',
    classification: '',
    topics: '',
    learning_objectives: '',
    system_requirements: '',
    source: '',
    thumbnail_url: '',
    status: 'active',
  });

  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [iframePreview, setIframePreview] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleUploadThumbnail = async (file: File) => {
    const supabase = createClient();
    setIsUploadingThumb(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `simulators/${fileName}`;

      const { error } = await supabase.storage
        .from('content_assets')
        .upload(filePath, file);

      if (error) {
        const fallback = await supabase.storage.from('public').upload(filePath, file);
        if (fallback.error) throw fallback.error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('content_assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrlData.publicUrl || '' }));
    } catch (error: any) {
      alert(`Erro no upload: ${error.message}`);
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      alert('O título é obrigatório.');
      return;
    }
    if (!formData.iframe_url?.trim()) {
      alert('A URL do iframe é obrigatória.');
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      router.push('/admin/gestao-conteudos/simuladores-3d');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 pb-32 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <Link
            href="/admin/gestao-conteudos/simuladores-3d"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Editar Simulador' : 'Novo Simulador 3D'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Preencha os dados abaixo para {isEdit ? 'atualizar o' : 'adicionar um novo'} simulador à plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/admin/gestao-conteudos/simuladores-3d')}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Salvar Alterações' : 'Criar Simulador'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="md:col-span-2 space-y-6">
          {/* Dados Principais */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Dados Principais</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título do Simulador <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Laboratório Virtual de Química"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL do Iframe (Simulador) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.iframe_url || ''}
                    onChange={e => setFormData({ ...formData, iframe_url: e.target.value })}
                    placeholder="https://phet.colorado.edu/sims/html/..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                  />
                  {formData.iframe_url && (
                    <button
                      type="button"
                      onClick={() => setIframePreview(!iframePreview)}
                      className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {iframePreview ? 'Ocultar' : 'Preview'}
                    </button>
                  )}
                </div>
                {iframePreview && formData.iframe_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <iframe
                      src={formData.iframe_url}
                      className="w-full aspect-video"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      title="Preview do simulador"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Área de Conhecimento
                </label>
                <input
                  type="text"
                  value={formData.knowledge_area || ''}
                  onChange={e => setFormData({ ...formData, knowledge_area: e.target.value })}
                  placeholder="Ex: Ciências da Natureza, Matemática, Física..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Objetivos de Aprendizagem
                </label>
                <textarea
                  rows={4}
                  value={formData.learning_objectives || ''}
                  onChange={e => setFormData({ ...formData, learning_objectives: e.target.value })}
                  placeholder="Descreva os objetivos pedagógicos. Separe por ; para listar múltiplos."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tópicos Abordados
                </label>
                <input
                  type="text"
                  value={formData.topics || ''}
                  onChange={e => setFormData({ ...formData, topics: e.target.value })}
                  placeholder="Separe por ; (Ex: Reações Químicas; Tabela Periódica; Ligações)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Configurações */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Configurações</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classificação</label>
                <input
                  type="text"
                  value={formData.classification || ''}
                  onChange={e => setFormData({ ...formData, classification: e.target.value })}
                  placeholder="Ex: Fundamental, Médio"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fonte / Provedor</label>
                <input
                  type="text"
                  value={formData.source || ''}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Ex: PhET, Google Arts..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Requisitos de Sistema</label>
                <textarea
                  rows={3}
                  value={formData.system_requirements || ''}
                  onChange={e => setFormData({ ...formData, system_requirements: e.target.value })}
                  placeholder="Ex: WebGL 2.0 compatível, JavaScript habilitado"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Thumbnail</h2>

            {formData.thumbnail_url ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    isUploadingThumb
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-4">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      {isUploadingThumb ? 'Enviando...' : 'Upload de imagem (JPG/PNG)'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleUploadThumbnail(e.target.files[0])}
                    disabled={isUploadingThumb}
                  />
                </label>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400">ou</span>
                </div>
                <input
                  type="url"
                  value={formData.thumbnail_url || ''}
                  onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="Cole a URL da imagem"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
