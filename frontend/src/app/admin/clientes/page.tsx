'use client';

import { useTenants, useProjects, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { Briefcase, Plus, Search, Eye, Edit2, Trash2, AlertTriangle, Image as ImageIcon, UploadCloud, FolderKanban } from 'lucide-react';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function TenantsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useTenants(page, limit);
  const tenants = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { data: projectsResponse } = useProjects(1, 100);
  const allProjects = projectsResponse?.data || [];

  const { mutateAsync: createTenantAsync, isPending: isCreating } = useCreateRecord('tenants');
  const { mutateAsync: updateTenantAsync, isPending: isUpdating } = useUpdateRecord('tenants');
  const { mutate: deleteTenant, isPending: isDeleting } = useDeleteRecord('tenants');

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    primary_color: '#4F46E5',
    secondary_color: '#818CF8',
    start_date: '',
    end_date: '',
    status: 'Ativo'
  });

  const filteredData = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const openModal = (type: ActionState['type'], record: any = null) => {
    setAction({ type, record });
    setLogoFile(null);
    setLogoPreview(record?.logo_url || '');
    const preSelected = record?.projects ? record.projects.map((p: any) => p.id).filter(Boolean) : [];
    setSelectedProjectIds(preSelected);
    setFormData(record ? {
      name: record.name || '',
      logo_url: record.logo_url || '',
      primary_color: record.primary_color || '#4F46E5',
      secondary_color: record.secondary_color || '#818CF8',
      start_date: record.start_date || '',
      end_date: record.end_date || '',
      status: record.status || 'Ativo'
    } : {
      name: '',
      logo_url: '',
      primary_color: '#4F46E5',
      secondary_color: '#818CF8',
      start_date: '',
      end_date: '',
      status: 'Ativo'
    });
  };

  const closeModal = () => {
    setAction({ type: null, record: null });
    setLogoFile(null);
    setLogoPreview('');
    setSelectedProjectIds([]);
    setFormData({ name: '', logo_url: '', primary_color: '#4F46E5', secondary_color: '#818CF8', start_date: '', end_date: '', status: 'Ativo' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const syncProjectAssignments = async (tenantId: string) => {
    const previousIds: string[] = action.record?.projects
      ? action.record.projects.map((p: any) => p.id).filter(Boolean)
      : [];

    const toAdd = selectedProjectIds.filter(id => !previousIds.includes(id));
    const toRemove = previousIds.filter(id => !selectedProjectIds.includes(id));

    if (toAdd.length > 0) {
      await supabase.from('projects').update({ tenant_id: tenantId }).in('id', toAdd);
    }
    if (toRemove.length > 0) {
      await supabase.from('projects').update({ tenant_id: null }).in('id', toRemove);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLogoUrl = formData.logo_url;

    if (logoFile) {
      setIsUploading(true);
      try {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
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
      name: formData.name.trim(),
      logo_url: finalLogoUrl || null,
      primary_color: formData.primary_color,
      secondary_color: formData.secondary_color,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: formData.status
    };

    try {
      if (action.type === 'create' && payload.name) {
        const newTenant = await createTenantAsync(payload);
        await syncProjectAssignments(newTenant.id);
      } else if (action.type === 'edit' && action.record && payload.name) {
        await updateTenantAsync({ id: action.record.id, payload });
        await syncProjectAssignments(action.record.id);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteTenant(action.record.id, { onSuccess: closeModal });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase">Ativo</span>;
      case 'Inativo':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">Inativo</span>;
      case 'Encerrada':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold uppercase">Encerrada</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">{status || '---'}</span>;
    }
  };

  const getCount = (countObj: any) => {
    if (Array.isArray(countObj) && countObj.length > 0) return countObj[0].count || 0;
    return 0;
  };

  const renderProjects = (projectsArr: any) => {
    if (!Array.isArray(projectsArr) || projectsArr.length === 0) return <span className="text-slate-400 text-sm">---</span>;
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {projectsArr.map((p, i) => (
          <span key={i} className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-xs font-bold leading-none">
            {p.name}
          </span>
        ))}
      </div>
    );
  };

  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting || isUploading;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Clientes (Tenants)"
        description="Configure múltiplos tenants. Defina a Identidade Visual (White-Label) de cada rede."
        icon={<Briefcase className="w-8 h-8 text-white" />}
        themeClass="bg-indigo-600"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-indigo-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Novo Cliente
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar cliente (tenant) por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhum cliente cadastrado ou encontrado na busca."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          {
            header: 'Cliente',
            accessor: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  {row.logo_url ? (
                    <img src={row.logo_url} alt={row.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{row.name}</span>
                  <span className="text-xs text-slate-500">
                    Vigência: {row.start_date ? new Date(row.start_date).toLocaleDateString('pt-BR') : '---'} até {row.end_date ? new Date(row.end_date).toLocaleDateString('pt-BR') : '---'}
                  </span>
                </div>
              </div>
            )
          },
          { header: 'Status', accessor: (row) => getStatusBadge(row.status), className: 'w-32' },
          { header: 'Escolas', accessor: (row) => <span className="font-medium text-slate-600">{getCount(row.schools)}</span>, className: 'w-24 text-center' },
          { header: 'Usuários', accessor: (row) => <span className="font-medium text-slate-600">{getCount(row.users)}</span>, className: 'w-24 text-center' },
          { header: 'Projetos Vinculados', accessor: (row) => renderProjects(row.projects), className: 'w-64 text-center' },
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
          isDelete ? 'Excluir Cliente (Tenant)' :
          isView ? 'Ficha do Cliente' :
          action.type === 'edit' ? 'Editar Cliente' :
          'Cadastrar Novo Cliente'
        }
      >
        {isDelete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">Você tem certeza que deseja desativar o cliente <strong>{action.record?.name}</strong>? Todo o fluxo será oculto do sistema.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button type="button" onClick={handleDelete} loading={isProcessing} className="bg-red-600 hover:bg-red-700 text-white">
                Sim, Excluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isView && action.record && (
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-center">
                  <span className="block text-2xl font-black text-indigo-600">{getCount(action.record.schools)}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Escolas</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-indigo-600">{getCount(action.record.users)}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuários</span>
                </div>
                <div className="text-center col-span-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Projetos</span>
                  {renderProjects(action.record.projects)}
                </div>
              </div>
            )}

            <InputField
              label="Nome do Cliente (Tenant)"
              placeholder="Ex: Secretaria de Educação SP"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />

            <div className="flex items-center gap-4 border border-slate-100 p-4 rounded-xl bg-slate-50">
              <div className="w-16 h-16 shrink-0 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center relative group">
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Logo da Rede (Opcional)</label>
                <p className="text-xs text-slate-500 mb-2">Clique na imagem ao lado para alterar a Logo oficial do Cliente. Recomendado: PNG/JPG quadrado.</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Cor Primária (HEX)</label>
                <div className="flex gap-2 items-center">
                  <div
                    className="relative w-10 h-10 rounded-lg border border-slate-200 shadow-sm shrink-0 overflow-hidden cursor-pointer"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      disabled={isView || isProcessing}
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    disabled={isView || isProcessing}
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    placeholder="#4F46E5"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Cor Secundária (HEX)</label>
                <div className="flex gap-2 items-center">
                  <div
                    className="relative w-10 h-10 rounded-lg border border-slate-200 shadow-sm shrink-0 overflow-hidden cursor-pointer"
                    style={{ backgroundColor: formData.secondary_color }}
                  >
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      disabled={isView || isProcessing}
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                    disabled={isView || isProcessing}
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    placeholder="#818CF8"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Data de Início"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                disabled={isView || isProcessing}
              />
              <InputField
                label="Data de Encerramento"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                disabled={isView || isProcessing}
              />
            </div>

            <SelectField
              label="Status do Cliente"
              options={[
                { value: 'Ativo', label: 'Ativo' },
                { value: 'Inativo', label: 'Inativo' },
                { value: 'Encerrada', label: 'Encerrada' }
              ]}
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              disabled={isView || isProcessing}
              required
            />

            {/* Seleção de Projetos */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <FolderKanban className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-700">Projetos do Cliente</span>
                {!isView && selectedProjectIds.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                    {selectedProjectIds.length} selecionado{selectedProjectIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {allProjects.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum projeto cadastrado.</p>
                ) : (
                  allProjects.map((project) => {
                    const isChecked = selectedProjectIds.includes(project.id);
                    return (
                      <label
                        key={project.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          isView ? 'cursor-default' : 'hover:bg-slate-50'
                        } ${isChecked ? 'bg-amber-50/60' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => !isView && toggleProject(project.id)}
                          disabled={isView || isProcessing}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                        />
                        <span className={`text-sm font-medium ${isChecked ? 'text-amber-700' : 'text-slate-700'}`}>
                          {project.name}
                        </span>
                        {project.tenants?.name && project.tenants.name !== action.record?.name && (
                          <span className="ml-auto text-xs text-slate-400 italic">
                            {project.tenants.name}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="ghost" onClick={closeModal}>
                {isView ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isView && (
                <Button type="submit" loading={isProcessing} disabled={!formData.name.trim() || isProcessing}>
                  {action.type === 'edit' ? 'Salvar Edição' : 'Salvar Cadastro'}
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
