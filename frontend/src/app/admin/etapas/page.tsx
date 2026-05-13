'use client';

import { useEducationStages, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { Layers, Plus, Search, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function EtapasPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useEducationStages(page, limit);
  const stages = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { mutate: createStage, isPending: isCreating } = useCreateRecord('education_stages');
  const { mutate: updateStage, isPending: isUpdating } = useUpdateRecord('education_stages');
  const { mutate: deleteStage, isPending: isDeleting } = useDeleteRecord('education_stages');

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  const [formData, setFormData] = useState({ name: '' });

  const filteredData = stages.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

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
      createStage({ name: formData.name.trim() }, { onSuccess: closeModal });
    } else if (action.type === 'edit' && action.record && formData.name.trim()) {
      updateStage({ id: action.record.id, payload: { name: formData.name.trim() } }, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteStage(action.record.id, { onSuccess: closeModal });
    }
  };

  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Etapas de Ensino"
        description="Gerencie as bases estruturais educacionais (ex: Ed. Infantil, Ensino Médio)."
        icon={<Layers className="w-8 h-8 text-white" />}
        themeClass="bg-teal-600"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-teal-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nova Etapa
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar etapa por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhuma etapa encontrada."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { header: 'Nome da Etapa', accessor: 'name' },
          { header: 'Data Criação', accessor: (row) => new Date(row.created_at || new Date()).toLocaleDateString('pt-BR'), className: 'w-48 text-right' },
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
          isDelete ? 'Excluir Etapa' : 
          isView ? 'Detalhes da Etapa' : 
          action.type === 'edit' ? 'Editar Etapa' : 
          'Criar Nova Etapa'
        }
      >
        {isDelete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">Tem certeza que deseja inativar a etapa <strong>{action.record?.name}</strong>?</p>
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
              label="Nome da Etapa"
              placeholder="Ex: Ensino Médio"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />
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
