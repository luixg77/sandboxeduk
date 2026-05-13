'use client';

import { useSchools, useDeleteRecord } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Building, Plus, Search, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EscolasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useSchools(page, limit);
  const schools = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { mutate: deleteSchool, isPending: isDeleting } = useDeleteRecord('schools');

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const filteredData = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.tenants?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteTarget?.id) {
      deleteSchool(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    }
  };

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Escolas"
        description="Agrupe turmas, professores e avaliações baseando-se por unidades escolares."
        icon={<Building className="w-8 h-8 text-white" />}
        themeClass="bg-emerald-600"
      >
        <button
          onClick={() => router.push('/admin/escolas/novo')}
          className="flex items-center gap-2 bg-white text-emerald-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nova Escola
        </button>
      </HeroSummary>

      <Card className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar escola ou tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </Card>

      <Table
        isLoading={isLoading}
        data={filteredData}
        emptyMessage="Nenhuma escola encontrada."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          { header: 'Nome da Escola', accessor: 'name' },
          { header: 'Cliente Pertencente (Tenant)', accessor: (row: any) => row.tenants?.name || '---' },
          { header: 'Data Geração', accessor: (row) => new Date(row.created_at || new Date()).toLocaleDateString('pt-BR'), className: 'w-48 text-right' },
          { 
            header: 'Ações', 
            accessor: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => router.push(`/admin/escolas/${row.id}`)} title="Gerenciar Escola" className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget(row)} title="Excluir" className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ),
            className: 'w-32 text-right'
          }
        ]}
      />

      <Modal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        title="Excluir Escola"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">Você tem certeza que deseja desativar a escola <strong>{deleteTarget?.name}</strong>? Ela deixará de aparecer nas listagens e filtros do sistema.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button type="button" onClick={handleDelete} loading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
