'use client';

import { useState, useMemo } from 'react';
import { HeroBanner, SectionTitle, SearchInput, FilterSelect, ProfIcons, LivroCard } from '@/components/professor-ui';

const MOCK = [
  { id: 'l1', title: 'Matemática — 2° Ano',            discipline: 'Matemática', grade: '2° Ano', isNew: true,  canDownload: true,  pcdVoice: true,  description: 'Números, operações e geometria para o 2° ano do ensino fundamental.' },
  { id: 'l2', title: 'Português — 3° Ano',             discipline: 'Português',  grade: '3° Ano',              canDownload: true,  pcdSign: true,   description: 'Leitura, escrita e produção textual.' },
  { id: 'l3', title: 'Ciências da Natureza — 1° Ano',  discipline: 'Ciências',   grade: '1° Ano',              canDownload: false,                  description: 'Exploração do mundo natural para os primeiros anos.' },
  { id: 'l4', title: 'História — 4° Ano',              discipline: 'História',   grade: '4° Ano',              canDownload: true,                   description: 'Brasil e mundo: formação histórica e cultural.' },
  { id: 'l5', title: 'Geografia — 3° Ano',             discipline: 'Geografia',  grade: '3° Ano',              canDownload: true,  pcdVoice: true,  description: 'Espaço, lugar e mapas para o 3° ano.' },
  { id: 'l6', title: 'Artes — 2° Ano',                 discipline: 'Artes',      grade: '2° Ano',              canDownload: false,                  description: 'Linguagens artísticas e expressão criativa.' },
  { id: 'l7', title: 'Matemática — 5° Ano',            discipline: 'Matemática', grade: '5° Ano', isNew: true,  canDownload: true,                   description: 'Álgebra, frações, decimais e probabilidade.' },
  { id: 'l8', title: 'Português — 1° Ano',             discipline: 'Português',  grade: '1° Ano',              canDownload: true,  pcdSign: true, pcdVoice: true, description: 'Alfabetização e letramento.' },
];

export default function LivrosPage() {
  const [search,     setSearch]     = useState('');
  const [discipline, setDiscipline] = useState('');
  const [grade,      setGrade]      = useState('');
  const [saved,      setSaved]      = useState<Set<string>>(new Set());

  const filtered = useMemo(() => MOCK.filter(b =>
    (!search     || b.title.toLowerCase().includes(search.toLowerCase())) &&
    (!discipline || b.discipline === discipline) &&
    (!grade      || b.grade === grade)
  ), [search, discipline, grade]);

  const toggleSave = (id: string) =>
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroBanner
        label="Biblioteca"
        title="Livros Didáticos"
        subtitle="Acesse o acervo completo de livros para suas turmas."
        illustration="books"
      />

      <div className="px-6 md:px-10 py-6 space-y-5">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar livro..." className="flex-1 min-w-[200px] max-w-sm" />
          <FilterSelect
            icon={<ProfIcons.Book />}
            placeholder="Disciplina"
            value={discipline}
            onChange={e => setDiscipline(e.target.value)}
            options={['Matemática','Português','Ciências','História','Geografia','Artes'].map(d => ({ value: d, label: d }))}
            accentColor="blue"
          />
          <FilterSelect
            icon={<ProfIcons.Turma />}
            placeholder="Ano / Série"
            value={grade}
            onChange={e => setGrade(e.target.value)}
            options={['1° Ano','2° Ano','3° Ano','4° Ano','5° Ano'].map(g => ({ value: g, label: g }))}
            accentColor="blue"
          />
        </div>

        <SectionTitle title="Livros Disponíveis" subtitle={`${filtered.length} livros`} accent="blue" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <LivroCard
              key={item.id}
              title={item.title}
              discipline={item.discipline}
              grade={item.grade}
              description={item.description}
              isNew={item.isNew}
              canDownload={item.canDownload}
              pcdSign={item.pcdSign}
              pcdVoice={item.pcdVoice}
              saved={saved.has(item.id)}
              onSave={() => toggleSave(item.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 font-semibold">
            Nenhum livro encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}
