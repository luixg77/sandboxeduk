'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEssayPrompt, useUpdateEssayPrompt, EssayPrompt, EssayDifficulty, EssayStatus } from '@/hooks/useEssayPrompts';
import { ArrowLeft, Save, UploadCloud, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

// O RichTextEditor deve ser importado dinamicamente caso use libs como Quill/TinyMCE que dependem de 'window'
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor').then(mod => mod.RichTextEditor), { ssr: false });

interface EssayPromptFormProps {
  initialData?: EssayPrompt;
  isEdit?: boolean;
}

export function EssayPromptForm({ initialData, isEdit = false }: EssayPromptFormProps) {
  const router = useRouter();
  const createMutation = useCreateEssayPrompt();
  const updateMutation = useUpdateEssayPrompt();

  const [formData, setFormData] = useState<Partial<EssayPrompt>>({
    internal_name: '',
    title: '',
    description: '',
    instructions: 'Seu texto deve ter no mínimo 7 e no máximo 30 linhas.\n\nO texto que não atender à proposta de redação receberá nota zero.\n\nSerá desconsiderado qualquer fragmento de texto que estiver fora do espaço destinado à redação.',
    difficulty_level: 'Média',
    status: 'Rascunho',
    category: 'Geral',
    cover_image_url: '',
    file_url: ''
  });

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleUpload = async (file: File, type: 'cover' | 'file') => {
    const supabase = createClient();
    const isCover = type === 'cover';
    
    isCover ? setIsUploadingCover(true) : setIsUploadingFile(true);

    try {
      // Usamos um bucket genérico ou criamos pasta essay_prompts
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `essay_prompts/${fileName}`;

      const { data, error } = await supabase.storage
        .from('content_assets')
        .upload(filePath, file);

      if (error) {
        // Fallback caso o bucket content_assets não exista, tenta public
        const fallback = await supabase.storage.from('public').upload(filePath, file);
        if (fallback.error) throw fallback.error;
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('content_assets')
        .getPublicUrl(filePath);

      const finalUrl = publicUrlData.publicUrl || '';

      if (isCover) {
        setFormData(prev => ({ ...prev, cover_image_url: finalUrl }));
      } else {
        setFormData(prev => ({ ...prev, file_url: finalUrl }));
      }

    } catch (error: any) {
      alert(`Erro no upload: ${error.message}`);
    } finally {
      isCover ? setIsUploadingCover(false) : setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      router.push('/admin/gestao-conteudos/redacoes');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 pb-32 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/gestao-conteudos/redacoes" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Editar Proposta de Redação' : 'Nova Proposta de Redação'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Preencha os dados abaixo para disponibilizar um novo tema aos professores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/gestao-conteudos/redacoes')}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Salvar Alterações' : 'Criar Proposta'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Dados Principais</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Tema <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: A persistência dos maus-tratos aos animais..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Interno (Para organização) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.internal_name}
                  onChange={e => setFormData({ ...formData, internal_name: e.target.value })}
                  placeholder="Ex: PROPOSTA 6 - ENEM 2024"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Textos Motivadores / Descrição</label>
                <RichTextEditor
                  wrapperClassName="min-h-[400px]"
                  value={formData.description || ''}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  onImageUpload={async (file: File) => {
                    const supabase = createClient();
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `essay_prompts/inline/${fileName}`;
                    const { error } = await supabase.storage.from('content_assets').upload(filePath, file);
                    if (error) throw error;
                    const { data: urlData } = supabase.storage.from('content_assets').getPublicUrl(filePath);
                    return urlData.publicUrl;
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Instruções para os Alunos</h2>
            <p className="text-sm text-slate-500 mb-4">Instruções padrão (ex: INEP) pré-preenchidas. Edite se necessário.</p>
            <textarea
              rows={10}
              value={formData.instructions || ''}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 resize-y"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Configurações</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as EssayStatus })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Publicado">Publicado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Dificuldade</label>
                <select
                  value={formData.difficulty_level}
                  onChange={e => setFormData({ ...formData, difficulty_level: e.target.value as EssayDifficulty })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Média">Média</option>
                  <option value="Difícil">Difícil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Ex: ENEM, Concursos)</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: ENEM"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Anexos</h2>
            
            <div className="space-y-6">
              {/* Imagem de Capa */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Imagem de Capa (Opcional)</label>
                {formData.cover_image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.cover_image_url} alt="Capa" className="w-full h-32 object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploadingCover ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-fuchsia-300'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">
                        {isUploadingCover ? 'Enviando...' : 'Clique para upload (JPG/PNG)'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')} disabled={isUploadingCover} />
                  </label>
                )}
              </div>

              {/* Arquivo PDF */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Arquivo da Proposta (Opcional)</label>
                {formData.file_url ? (
                  <div className="relative flex items-center p-3 rounded-xl border border-slate-200 bg-slate-50 group">
                    <div className="w-10 h-10 bg-fuchsia-100 text-fuchsia-600 rounded-lg flex items-center justify-center mr-3 shrink-0">
                      <span className="text-xs font-bold">PDF</span>
                    </div>
                    <div className="truncate text-sm font-medium text-slate-700 flex-1">
                      {formData.file_url.split('/').pop()}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, file_url: '' })}
                      className="p-1.5 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploadingFile ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-fuchsia-300'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">
                        {isUploadingFile ? 'Enviando...' : 'Upload da proposta completa (PDF)'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="application/pdf,image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'file')} disabled={isUploadingFile} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
