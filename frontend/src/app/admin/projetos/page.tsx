'use client';

import { useProjects, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { FolderKanban, Plus, Search, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function ProjetosPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useProjects(page, limit);
  const projects = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { mutate: createProject, isPending: isCreating } = useCreateRecord('projects');
  const { mutate: updateProject, isPending: isUpdating } = useUpdateRecord('projects');
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteRecord('projects');

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  const [formData, setFormData] = useState({ name: '' });

  const filteredData = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tenants?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type: ActionState['type'], record: any = null) => {
    setAction({ type, record });
    setFormData(record ? { name: record.name } : { name: '' });
  };

  const closeModal = () => {
    setAction({ type: null, record: null });
    setFormData({ name: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action.type === 'create' && formData.name.trim()) {
      createProject({ name: formData.name.trim() }, { onSuccess: closeModal });
    } else if (action.type === 'edit' && action.record && formData.name.trim()) {
      updateProject({ id: action.record.id, payload: { name: formData.name.trim() } }, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteProject(action.record.id, { onSuccess: closeModal });
    }
  };

  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Projetos"
        description="Configure ciclos de ensino ou projetos específicos (ex: Reforço, Projeto SAEB)."
        icon={<FolderKanban className="w-8 h-8 text-white" />}
        themeClass="bg-amber-500"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-amber-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Novo Projeto
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar projeto ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhum projeto encontrado."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { header: 'Nome do Projeto', accessor: 'name' },
          { header: 'Cliente Vinculado', accessor: (row: any) => row.tenants?.name || <span className="text-slate-400">Não vinculado</span> },
          { header: 'Data Geração', accessor: (row) => new Date(row.created_at || new Date()).toLocaleDateString('pt-BR'), className: 'w-48 text-right' },
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
          isDelete ? 'Excluir Projeto' :
          isView ? 'Detalhes do Projeto' :
          action.type === 'edit' ? 'Editar Projeto' :
          'Criar Novo Projeto'
        }
      >
        {isDelete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">Você tem certeza que deseja desativar o projeto <strong>{action.record?.name}</strong>? Todo o fluxo será oculto do sistema.</p>
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
              label="Nome do Projeto"
              placeholder="Ex: Projeto Reforço SAEB 2026"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />
            {isView && action.record?.tenants?.name && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 font-medium">
                Cliente: {action.record.tenants.name}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
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
