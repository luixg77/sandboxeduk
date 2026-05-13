'use client';

import { useGrades, useEducationStages, useCreateRecord, useUpdateRecord, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { GraduationCap, Plus, Search, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

type ActionState = { type: 'create' | 'edit' | 'view' | 'delete' | null, record: any };

export default function SeriesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useGrades(page, limit);
  const grades = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { data: stagesResp, isLoading: loadingStages } = useEducationStages(1, 100);
  const stages = stagesResp?.data || [];

  const { mutate: createGrade, isPending: isCreating } = useCreateRecord('grades');
  const { mutate: updateGrade, isPending: isUpdating } = useUpdateRecord('grades');
  const { mutate: deleteGrade, isPending: isDeleting } = useDeleteRecord('grades');

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ type: null, record: null });
  const [formData, setFormData] = useState({ name: '', stage_id: '' });

  const filteredData = grades.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.education_stages?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type: ActionState['type'], record: any = null) => {
    setAction({ type, record });
    setFormData(record ? { name: record.name, stage_id: record.stage_id || '' } : { name: '', stage_id: '' });
  };

  const closeModal = () => {
    setAction({ type: null, record: null });
    setFormData({ name: '', stage_id: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action.type === 'create' && formData.name.trim() && formData.stage_id) {
      createGrade({ name: formData.name.trim(), stage_id: formData.stage_id }, { onSuccess: closeModal });
    } else if (action.type === 'edit' && action.record && formData.name.trim() && formData.stage_id) {
      updateGrade({ id: action.record.id, payload: { name: formData.name.trim(), stage_id: formData.stage_id } }, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (action.record?.id) {
      deleteGrade(action.record.id, { onSuccess: closeModal });
    }
  };

  const stageOptions = stages.map(s => ({ value: s.id, label: s.name }));
  
  const isView = action.type === 'view';
  const isDelete = action.type === 'delete';
  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Séries"
        description="Cadastre as séries e anos vitais e associe-os às Etapas de Ensino (Ex: 9º Ano vincula-se aos Anos Finais)."
        icon={<GraduationCap className="w-8 h-8 text-white" />}
        themeClass="bg-emerald-600"
      >
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-white text-emerald-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nova Série
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar série ou etapa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhuma série encontrada."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { header: 'Nome da Série/Ano', accessor: 'name' },
          { 
            header: 'Etapa de Ensino (Pertencente)', 
            accessor: (row: any) => (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                {row.education_stages?.name || '---'}
              </span>
            ) 
          },
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
          isDelete ? 'Excluir Série' : 
          isView ? 'Detalhes da Série' : 
          action.type === 'edit' ? 'Editar Série' : 
          'Criar Nova Série'
        }
      >
        {isDelete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">Tem certeza que deseja inativar a série <strong>{action.record?.name}</strong>?</p>
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
              label="Nome da Série / Ano"
              placeholder="Ex: 1º Ano do E.M."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              autoFocus={!isView}
              disabled={isView || isProcessing}
            />
            <SelectField
              label="Vincular à Etapa de Ensino"
              options={stageOptions}
              value={formData.stage_id}
              onChange={(e) => setFormData(prev => ({ ...prev, stage_id: e.target.value }))}
              required
              disabled={isView || isProcessing || loadingStages}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                {isView ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isView && (
                <Button type="submit" loading={isProcessing} disabled={!formData.name.trim() || !formData.stage_id || isProcessing}>
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
