'use client';

import { useUsers, useSchools, useTenants, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { Users, Plus, Search, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useUsers(page, limit);
  const users = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { data: schoolsResp, isLoading: loadingSchools } = useSchools(1, 400);
  const schools = schoolsResp?.data || [];

  const { data: tenantsResp, isLoading: loadingTenants } = useTenants(1, 400);
  const tenants = tenantsResp?.data || [];
  
  const { mutate: createUser, isPending: isCreating } = useCreateRecord('users');
  const { mutate: updateUser, isPending: isUpdating } = useUpdateRecord('users');
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteRecord('users');

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    role:            '',
    organization_id: '',
    tenant_id:       '',
    school_id:       '',
  });

  const filteredData = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type: ActionState['type'], record: any = null) => {
    setAction({ type, record });
    setFormData(record ? {
      name:            record.name            || '',
      email:           record.email           || '',
      role:            record.role            || '',
      organization_id: record.organization_id || '',
      tenant_id:       record.tenant_id       || '',
      school_id:       record.school_id       || '',
    } : { name: '', email: '', role: '', organization_id: '', tenant_id: '', school_id: '' });
  };

  const closeModal = () => {
    setAction({ type: null, record: null });
    setFormData({ name: '', email: '', role: '', organization_id: '', tenant_id: '', school_id: '' });
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((t: any) => t.id === tenantId);
    setFormData(prev => ({
      ...prev,
      tenant_id:       tenantId,
      organization_id: tenant?.organization_id || '',
      school_id:       '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name:            formData.name.trim(),
      email:           formData.email.trim(),
      role:            formData.role,
      organization_id: formData.organization_id,
      tenant_id:       formData.tenant_id,
      school_id:       formData.school_id,
    };

    if (action.type === 'create') {
      createUser(payload, { onSuccess: closeModal });
    } else if (action.type === 'edit' && action.record) {
      updateUser({ id: action.record.id, payload }, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteUser(action.record.id, { onSuccess: closeModal });
    }
  };

  const roleOptions = [
    { value: 'gestor', label: 'Gestor' },
    { value: 'coordenador', label: 'Coordenador' },
    { value: 'professor', label: 'Professor' }
  ];

  const tenantOptions = tenants.map(t => ({ value: t.id, label: t.name }));
  
  // Filter schools based on selected tenant
  const filteredSchools = schools.filter(s => s.tenant_id === formData.tenant_id);
  const schoolOptions = filteredSchools.map(s => ({ value: s.id, label: s.name }));

  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Usuários"
        description="Adicione profissionais da educação e gerencie papéis de acesso à plataforma."
        icon={<Users className="w-8 h-8 text-white" />}
        themeClass="bg-rose-600"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-rose-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Novo Usuário
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar usuário por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhum usuário encontrado."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { header: 'Nome', accessor: 'name' },
          { header: 'E-mail', accessor: 'email' },
          { header: 'Papel', accessor: (row) => (
             <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
               {row.role}
             </span>
          )},
          { header: 'Escola', accessor: (row: any) => row.schools?.name || '---', className: 'truncate max-w-[200px]' },
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
          isDelete ? 'Excluir Usuário' : 
          isView ? 'Detalhes do Usuário' : 
          action.type === 'edit' ? 'Editar Usuário' : 
          'Cadastrar Novo Usuário'
        }
      >
        {isDelete ? (
           <div className="space-y-4">
             <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
               <AlertTriangle className="w-6 h-6 shrink-0" />
               <p className="text-sm font-medium">Você tem certeza que deseja desativar o usuário <strong>{action.record?.name} ({action.record?.email})</strong>?</p>
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
            <InputField
              label="Nome Completo"
              placeholder="Ex: Ana Silva"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />
            <InputField
              type="email"
              label="E-mail"
              placeholder="Ex: ana.silva@escola.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isView || isProcessing}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Cargo / Papel"
                options={roleOptions}
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                required
                disabled={isView || isProcessing}
              />
              <SelectField
                label="Cliente (Tenant)"
                options={tenantOptions}
                value={formData.tenant_id}
                onChange={(e) => handleTenantChange(e.target.value)}
                required
                disabled={isView || isProcessing || loadingTenants}
              />
            </div>
            <SelectField
              label="Escola"
              options={schoolOptions}
              value={formData.school_id}
              onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
              required
              disabled={!formData.tenant_id || isView || isProcessing || loadingSchools}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                {isView ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isView && (
                <Button type="submit" loading={isProcessing} disabled={!formData.name || !formData.email || !formData.role || !formData.tenant_id || !formData.school_id || isProcessing}>
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
