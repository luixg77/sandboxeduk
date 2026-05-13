'use client';

import { useOrganizations, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { Building2, Plus, Search, Eye, Edit2, Trash2, AlertTriangle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function OrganizacaoPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useOrganizations(page, limit);
  const organizations = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { mutate: createOrganization, isPending: isCreating } = useCreateRecord('organizations');
  const { mutate: updateOrganization, isPending: isUpdating } = useUpdateRecord('organizations');
  const { mutate: deleteOrganization, isPending: isDeleting } = useDeleteRecord('organizations');

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  const [newName, setNewName] = useState('');
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const filteredData = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type: ActionState['type'], record: any = null) => {
    setAction({ type, record });
    setNewName(record ? record.name : '');
    setLogoPreview(record?.logo_url || '');
    setLogoFile(null);
  };

  const closeModal = () => {
    setAction({ type: null, record: null });
    setNewName('');
    setLogoPreview('');
    setLogoFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLogoUrl = action.record?.logo_url || '';

    if (logoFile) {
      setIsUploading(true);
      try {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `org-${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logoclient')
          .upload(filePath, logoFile, { cacheControl: '3600', upsert: false });
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('logoclient').getPublicUrl(filePath);
        finalLogoUrl = publicUrl;
      } catch (err: any) {
        console.error('Upload Error:', err);
        alert('Erro ao enviar a imagem. Tente novamente.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const payload = {
      name: newName.trim(),
      logo_url: finalLogoUrl || null
    };

    if (action.type === 'create' && payload.name) {
      createOrganization(payload, { onSuccess: closeModal });
    } else if (action.type === 'edit' && action.record && payload.name) {
      updateOrganization({ id: action.record.id, payload }, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteOrganization(action.record.id, { onSuccess: closeModal });
    }
  };

  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting || isUploading;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Organizações"
        description="Controle e expanda a principal rede corporativa (White-label) com sua logomarca."
        icon={<Building2 className="w-8 h-8 text-white" />}
        themeClass="bg-blue-600"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-blue-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nova Organização
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar organização por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhuma organização cadastrada."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { 
            header: 'Organização', 
            accessor: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  {row.logo_url ? (
                    <img src={row.logo_url} alt={row.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <span className="font-semibold text-slate-900">{row.name}</span>
              </div>
            )
          },
          { header: 'Data de Fundação/Cadastro', accessor: (row) => new Date(row.created_at || new Date()).toLocaleDateString('pt-BR'), className: 'w-64 text-right' },
          { 
            header: 'Ações', 
            accessor: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openModal('view', row)} title="Visualizar" className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-colors"><Eye className="w-4 h-4" /></button>
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
          isDelete ? 'Excluir Organização' : 
          isView ? 'Detalhes da Organização' : 
          action.type === 'edit' ? 'Editar Organização' : 
          'Cadastrar Nova Organização'
        }
      >
        {isDelete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">Tem certeza que deseja desativar a organização <strong>{action.record?.name}</strong>?</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button type="button" onClick={handleDelete} loading={isProcessing} className="bg-red-600 hover:bg-red-700 text-white">
                Sim, Excluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Nome da Organização"
              placeholder="Ex: Kodar SA"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />

            <div className="flex items-center gap-4 border border-slate-100 p-4 rounded-xl bg-slate-50">
              <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center relative group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
                {!isView && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Logo da Plataforma (Opcional)</label>
                <p className="text-xs text-slate-500 mb-2">Clique na imagem ao lado para alterar a Logo oficial do Menu (White-label).</p>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isView || isProcessing}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="ghost" onClick={closeModal}>
                {isView ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isView && (
                <Button type="submit" loading={isProcessing} disabled={!newName.trim() || isProcessing}>
                  {action.type === 'edit' ? 'Salvar Configurações' : 'Salvar Cadastro'}
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
