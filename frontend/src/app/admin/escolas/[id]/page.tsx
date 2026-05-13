'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSchoolById, useTenants, useCreateRecord, useUpdateRecord, useClassesBySchoolId, useGrades, useDeleteRecord } from '@/hooks/useAdminData';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import InputField from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Building, Users2, FileSpreadsheet, Plus, UploadCloud, Download, AlertTriangle, Trash2, Edit2 } from 'lucide-react';

export default function EscolaHubPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;
  const isNew = schoolId === 'novo';

  const [activeTab, setActiveTab] = useState<'dados' | 'turmas'>('dados');
  
  // --- DADOS DA ESCOLA STATE --- //
  const { data: schoolData, isLoading: loadingSchool } = useSchoolById(schoolId);
  const { data: tenantsResp } = useTenants(1, 100);
  const tenants = tenantsResp?.data || [];
  
  const { mutate: createSchool, isPending: isCreatingSchool } = useCreateRecord('schools');
  const { mutate: updateSchool, isPending: isUpdatingSchool } = useUpdateRecord('schools');

  const [schoolForm, setSchoolForm] = useState({ name: '', tenant_id: '' });

  // Update local form state when data finishes loading
  useEffect(() => {
    if (!isNew && schoolData) {
      setSchoolForm({ name: schoolData.name, tenant_id: schoolData.tenant_id });
    }
  }, [schoolData, isNew]);

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createSchool(schoolForm, {
        onSuccess: (data: any) => {
          // Quando criada com sucesso, troca a URL para a Escola que agora existe, liberando as Turmas
          router.replace(`/admin/escolas/${data.id}`);
        }
      });
    } else {
      updateSchool({ id: schoolId, payload: schoolForm });
    }
  };

  // --- TURMAS STATE --- //
  const [classPage, setClassPage] = useState(1);
  const limit = 20;
  const { data: classesResp, isLoading: loadingClasses } = useClassesBySchoolId(schoolId, classPage, limit);
  const classesData = classesResp?.data || [];
  const totalClassPages = classesResp?.count ? Math.ceil(classesResp.count / limit) : 1;

  const { data: gradesResp } = useGrades(1, 100);
  const grades = gradesResp?.data || [];

  const { mutate: createClass, isPending: isCreatingClass } = useCreateRecord('classes');
  const { mutate: updateClass, isPending: isUpdatingClass } = useUpdateRecord('classes');
  const { mutate: deleteClass, isPending: isDeletingClass } = useDeleteRecord('classes');

  type ClassAction = { type: 'create' | 'edit' | 'delete' | 'import' | null, record: any };
  const [classAction, setClassAction] = useState<ClassAction>({ type: null, record: null });
  const [classForm, setClassForm] = useState({ name: '', grade_id: '', shift: 'Matutino', status: 'Ativa' });

  const openClassModal = (type: ClassAction['type'], record: any = null) => {
    setClassAction({ type, record });
    setClassForm(record ? {
      name: record.name,
      grade_id: record.grade_id,
      shift: record.shift,
      status: record.status
    } : { name: '', grade_id: '', shift: 'Matutino', status: 'Ativa' });
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...classForm, school_id: schoolId };

    if (classAction.type === 'create') {
      createClass(payload, { onSuccess: () => setClassAction({ type: null, record: null }) });
    } else if (classAction.type === 'edit' && classAction.record) {
      updateClass({ id: classAction.record.id, payload }, { onSuccess: () => setClassAction({ type: null, record: null }) });
    }
  };

  const handleDeleteClass = () => {
    if (classAction.record?.id) {
       deleteClass(classAction.record.id, { onSuccess: () => setClassAction({ type: null, record: null }) });
    }
  };

  // --- IMPORTAÇÃO CSV LÓGICA --- //
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const generateTemplateCSV = () => {
    const csvHeader = "Nome da Turma,ID_Série,Turno(Matutino/Vespertino/Noturno/Integral)\nTurma A,cole_o_id_aqui,Matutino";
    const blob = new Blob([csvHeader], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koder_template_turmas.csv`;
    a.click();
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Processando arquivo...');
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        
        let successCount = 0;
        let failCount = 0;

        // Itera pulando o Cabeçalho (index 0)
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(',');
          if (columns.length >= 3) {
            const name = columns[0].trim();
            const grade_id = columns[1].trim();
            const shift = columns[2].trim();

            if (name && grade_id && shift) {
              // Chamada individual - Múltiplos creates
              createClass({
                name,
                grade_id,
                shift,
                school_id: schoolId,
                status: 'Ativa'
              });
              successCount++;
            } else {
              failCount++;
            }
          }
        }
        
        setImportStatus(`Importação enviada para fila! (${successCount} lidos com sucesso, ${failCount} inválidos). A tabela será atualizada em breve.`);
        setTimeout(() => {
          setImportStatus('');
          setClassAction({ type: null, record: null });
        }, 5000);
      } catch (err) {
        setImportStatus('Erro interno ao ler arquivo CSV.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 pb-32">
      {/* HEADER NAV */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/admin/escolas')}
          className="p-2.5 bg-white rounded-xl shadow border border-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {isNew ? 'Criar Nova Escola' : (schoolData?.name || 'Carregando...')}
          </h1>
          <p className="text-slate-500 text-sm">Hub da Unidade Escolar e Controle de Turmas.</p>
        </div>
      </div>

      {loadingSchool && !isNew ? (
        <div className="text-slate-400">Carregando dados da escola...</div>
      ) : (
        <>
          {/* TABS MENU */}
          <div className="flex gap-2 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('dados')}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'dados' ? 'border-kodar-600 text-kodar-700' : 'border-transparent text-slate-400 hover:text-slate-600'}
              `}
            >
              <Building className="w-4 h-4" /> Ficha da Escola
            </button>
            <button
              onClick={() => setActiveTab('turmas')}
              disabled={isNew}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'turmas' ? 'border-kodar-600 text-kodar-700' : 'border-transparent text-slate-400 hover:text-slate-600'}
                ${isNew && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <Users2 className="w-4 h-4" /> Turmas Vinculadas
            </button>
          </div>

          {/* TAB CONTENT: DADOS DA ESCOLA */}
          {activeTab === 'dados' && (
            <div className="max-w-2xl">
              <Card className="p-6">
                <form onSubmit={handleSaveSchool} className="space-y-6">
                  <InputField
                    label="Nome da Escola"
                    placeholder="Ex: E.M. Machado de Assis"
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <SelectField
                    label="Cliente Responsável (Tenant)"
                    options={tenants.map(t => ({ value: t.id, label: t.name }))}
                    value={schoolForm.tenant_id}
                    onChange={(e) => setSchoolForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                    required
                  />
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" loading={isCreatingSchool || isUpdatingSchool}>
                      {isNew ? 'Salvar Escola e Continuar' : 'Atualizar Dados da Escola'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* TAB CONTENT: TURMAS */}
          {activeTab === 'turmas' && !isNew && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Turmas Desta Escola</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => openClassModal('import')}
                    className="flex flex-col items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <div className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> Importar Planilha</div>
                  </button>
                  <button
                    onClick={() => openClassModal('create')}
                    className="flex flex-col items-center gap-2 bg-kodar-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow hover:bg-kodar-700 transition-colors"
                  >
                    <div className="flex items-center gap-2"><Plus className="w-5 h-5" /> Adicionar Turma Manual</div>
                  </button>
                </div>
              </div>

              <Table
                isLoading={loadingClasses}
                data={classesData}
                emptyMessage="Nenhuma turma cadastrada nesta escola ainda."
                currentPage={classPage}
                totalPages={totalClassPages}
                onPageChange={setClassPage}
                columns={[
                  { header: 'Turma', accessor: 'name' },
                  { header: 'Série', accessor: (row: any) => row.grades?.name || '---' },
                  { header: 'Turno', accessor: 'shift' },
                  { header: 'Status', accessor: (row) => (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${row.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {row.status}
                    </span>
                  )},
                  { 
                    header: 'Ações', 
                    accessor: (row) => (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openClassModal('edit', row)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => openClassModal('delete', row)} className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ),
                    className: 'w-24 text-right'
                  }
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* SUB-MODAIS DA ABA TURMAS */}
      <Modal 
        isOpen={!!classAction.type} 
        onClose={() => setClassAction({ type: null, record: null })} 
        title={
          classAction.type === 'delete' ? 'Excluir Turma' : 
          classAction.type === 'import' ? 'Importação em Lote via Planilha (CSV)' :
          classAction.type === 'edit' ? 'Editar Turma' : 
          'Adicionar Turma na Escola'
        }
      >
        {classAction.type === 'delete' ? (
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
               <AlertTriangle className="w-6 h-6 shrink-0" />
               <p className="text-sm font-medium">Tem certeza que deseja desvincular/excluir a turma <strong>{classAction.record?.name}</strong> desta escola?</p>
             </div>
             <div className="flex justify-end gap-3 pt-4">
               <Button type="button" variant="ghost" onClick={() => setClassAction({ type: null, record: null })}>Cancelar</Button>
               <Button type="button" onClick={handleDeleteClass} loading={isDeletingClass} className="bg-red-600 hover:bg-red-700 text-white">Sim, Excluir</Button>
             </div>
          </div>
        ) : classAction.type === 'import' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
              <p className="font-semibold mb-2">Instruções de Importação:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Baixe o template padrão (CSV).</li>
                <li>Mantenha o cabeçalho original.</li>
                <li>Preencha a coluna ID_Série com os identificadores UUID corretos das séries do seu banco.</li>
                <li>Suba o arquivo novamente aqui.</li>
              </ul>
              <button onClick={generateTemplateCSV} className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 underline">
                <Download className="w-4 h-4" /> Baixar Template CSV
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Clique para selecionar seu Arquivo CSV</p>
              <p className="text-xs text-slate-500 mt-1">Leva apenas alguns segundos para processar milhares de turmas.</p>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleCSVUpload}
              />
            </div>
            
            {importStatus && (
              <p className="text-sm font-medium text-amber-600 text-center">{importStatus}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveClass} className="space-y-4">
            <InputField
              label="Nome/Identificador da Turma"
              placeholder="Ex: Turma A, 901 ..."
              value={classForm.name}
              onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <SelectField
              label="Série (Ano)"
              options={grades.map(g => ({ value: g.id, label: g.name }))}
              value={classForm.grade_id}
              onChange={(e) => setClassForm(prev => ({ ...prev, grade_id: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
               <SelectField
                label="Turno"
                options={[
                  { value: 'Matutino', label: 'Matutino' },
                  { value: 'Vespertino', label: 'Vespertino' },
                  { value: 'Noturno', label: 'Noturno' },
                  { value: 'Integral', label: 'Integral' },
                ]}
                value={classForm.shift}
                onChange={(e) => setClassForm(prev => ({ ...prev, shift: e.target.value }))}
                required
              />
               <SelectField
                label="Status da Turma"
                options={[
                  { value: 'Ativa', label: 'Ativa' },
                  { value: 'Inativa', label: 'Inativa' }
                ]}
                value={classForm.status}
                onChange={(e) => setClassForm(prev => ({ ...prev, status: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setClassAction({ type: null, record: null })}>Cancelar</Button>
              <Button type="submit" loading={isCreatingClass || isUpdatingClass} disabled={!classForm.name.trim() || !classForm.grade_id}>
                {classAction.type === 'edit' ? 'Salvar Edição' : 'Adicionar Turma'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
