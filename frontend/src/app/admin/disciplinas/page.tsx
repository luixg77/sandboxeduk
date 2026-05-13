'use client';

import { useDisciplines, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { Plus, Search, Eye, Edit2, Trash2, AlertTriangle, UploadCloud, Image as ImageIcon, BookOpen } from 'lucide-react';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function DisciplinasPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useDisciplines(page, limit);
  const disciplines = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { mutate: createDiscipline, isPending: isCreating } = useCreateRecord('disciplines');
  const { mutate: updateDiscipline, isPending: isUpdating } = useUpdateRecord('disciplines');
  const { mutate: deleteDiscipline, isPending: isDeleting } = useDeleteRecord('disciplines');

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  
  const [formData, setFormData] = useState({
    name:        '',
    color_hex:   '#4F46E5',
    icon_3d_url: '',
    origin:      'sistema' as 'sistema' | 'avulsa',
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Filtro
  const filteredData = disciplines.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type: ActionState['type'], record: any = null) => {
    setAction({ type, record });
    setFormData(record ? {
      name:        record.name        || '',
      color_hex:   record.color_hex   || '#4F46E5',
      icon_3d_url: record.icon_3d_url || '',
      origin:      record.origin      || 'sistema',
    } : {
      name:        '',
      color_hex:   '#4F46E5',
      icon_3d_url: '',
      origin:      'sistema',
    });
    setIconPreview(record?.icon_3d_url || '');
    setIconFile(null);
  };

  const closeModal = () => {
    setAction({ type: null, record: null });
    setFormData({ name: '', color_hex: '#4F46E5', icon_3d_url: '', origin: 'sistema' });
    setIconPreview('');
    setIconFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalIconUrl = formData.icon_3d_url;

    if (iconFile) {
      setIsUploading(true);
      try {
        const fileExt = iconFile.name.split('.').pop();
        const fileName = `icon-${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `models/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('disciplinas3d')
          .upload(filePath, iconFile, { cacheControl: '3600', upsert: false });
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('disciplinas3d').getPublicUrl(filePath);
        finalIconUrl = publicUrl;
      } catch (err: any) {
        console.error('Upload Error:', err);
        alert('Erro ao enviar o ícone. Tente novamente.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const payload = {
      name:        formData.name.trim(),
      color_hex:   formData.color_hex,
      icon_3d_url: finalIconUrl || null,
      origin:      formData.origin,
    };

    if (action.type === 'create' && payload.name) {
      createDiscipline(payload, { onSuccess: closeModal });
    } else if (action.type === 'edit' && action.record && payload.name) {
      updateDiscipline({ id: action.record.id, payload }, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteDiscipline(action.record.id, { onSuccess: closeModal });
    }
  };

  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting || isUploading;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Disciplinas"
        description="Cadastre as matrizes curriculares e defina o Ícone 3D e a Cor Base para cada uma delas."
        icon={<BookOpen className="w-8 h-8 text-white" />}
        themeClass="bg-purple-600"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-purple-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nova Disciplina
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhuma disciplina cadastrada na matriz geral."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { 
            header: 'Disciplina Visual', 
            accessor: (row) => (
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl p-[2px] shadow-sm flex items-center justify-center shrink-0 relative overflow-hidden" 
                  style={{ background: `linear-gradient(135deg, ${row.color_hex}40, ${row.color_hex})` }}
                >
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                  <div className="absolute inset-[2px] bg-white rounded-[10px] z-0"></div>
                  {row.icon_3d_url ? (
                    <img src={row.icon_3d_url} alt={row.name} className="w-8 h-8 object-contain z-10 scale-110 drop-shadow-md mix-blend-multiply" />
                  ) : (
                    <BookOpen className="w-6 h-6 z-10" style={{ color: row.color_hex }} />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{row.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full mt-1 inline-block border bg-slate-50" style={{ borderColor: row.color_hex, color: row.color_hex }}>{row.color_hex}</span>
                </div>
              </div>
            )
          },
          {
            header: 'Origem',
            accessor: (row) => (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                row.origin === 'avulsa'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {row.origin === 'avulsa' ? 'Avulsa' : 'Sistema'}
              </span>
            ),
            className: 'w-32',
          },
          { header: 'Adicionado Em', accessor: (row) => new Date(row.created_at || new Date()).toLocaleDateString('pt-BR'), className: 'w-48 text-right' },
          { 
            header: 'Ações', 
            accessor: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openModal('view', row)} title="Visualizar" className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-purple-600 rounded-md transition-colors"><Eye className="w-4 h-4" /></button>
                <button onClick={() => openModal('edit', row)} title="Editar" className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => openModal('delete', row)} title="Excluir" className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ),
            className: 'w-32 text-right'
          }
        ]}
      />

      <Modal 
        isOpen={!!action.type} 
        onClose={closeModal} 
        title={
          isDelete ? 'Remover Disciplina' : 
          isView ? 'Detalhes da Disciplina' : 
          action.type === 'edit' ? 'Editar Disciplina' : 
          'Nova Disciplina'
        }
      >
        {isDelete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">Tem certeza que remover a disciplina <strong>{action.record?.name}</strong> da base?</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button type="button" onClick={handleDelete} loading={isProcessing} className="bg-red-600 hover:bg-red-700 text-white">
                Sim, Remover
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Nome da Disciplina"
              placeholder="Ex: Física Quântica"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />

            {/* Origem */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Origem</label>
              <div className="grid grid-cols-2 gap-3">
                {(['sistema', 'avulsa'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    disabled={isView || isProcessing}
                    onClick={() => setFormData(prev => ({ ...prev, origin: opt }))}
                    className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                      formData.origin === opt
                        ? opt === 'sistema'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                    } disabled:opacity-60 disabled:cursor-default`}
                  >
                    <span className="text-lg">{opt === 'sistema' ? '🏛️' : '📌'}</span>
                    <span>{opt === 'sistema' ? 'Sistema' : 'Avulsa'}</span>
                    <span className="text-[11px] font-normal text-current opacity-70">
                      {opt === 'sistema' ? 'Padrão da plataforma' : 'Adicionada manualmente'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 border border-slate-100 p-4 rounded-xl bg-slate-50">
              <div 
                className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center relative group p-[2px]"
                style={{ background: `linear-gradient(135deg, ${formData.color_hex}40, ${formData.color_hex})` }}
              >
                 <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] rounded-2xl"></div>
                 <div className="absolute inset-[2px] bg-white rounded-[14px] z-0"></div>
                {iconPreview ? (
                  <img src={iconPreview} alt="Ícone 3D" className="w-12 h-12 object-contain z-10 drop-shadow-md scale-110" />
                ) : (
                  <ImageIcon className="w-6 h-6 z-10" style={{ color: formData.color_hex }} />
                )}
                {!isView && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-[2px] rounded-[14px] bg-black/60 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Miniatura 3D (Opcional)</label>
                <p className="text-xs text-slate-500 mb-2">Anexe um elemento visual `.PNG` com fundo transparente. Recomendado: 120x120px.</p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isView || isProcessing}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-1/2">
              <label className="text-sm font-semibold text-slate-700">Cor Hexadecimal</label>
              <div className="flex gap-2 items-center">
                <div 
                  className="relative w-10 h-10 rounded-lg border border-slate-200 shadow-sm shrink-0 overflow-hidden cursor-pointer" 
                  style={{ backgroundColor: formData.color_hex }}
                >
                  <input
                    type="color"
                    value={formData.color_hex}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                    disabled={isView || isProcessing}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 opacity-0 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={formData.color_hex}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                  disabled={isView || isProcessing}
                  className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  placeholder="#4F46E5"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="ghost" onClick={closeModal}>
                {isView ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isView && (
                <Button type="submit" loading={isProcessing} disabled={!formData.name.trim() || isProcessing} className="bg-purple-600 hover:bg-purple-700">
                  {action.type === 'edit' ? 'Salvar Configurações' : 'Salvar Disciplina'}
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
