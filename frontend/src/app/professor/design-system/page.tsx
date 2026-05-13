'use client';

import { useState } from 'react';
import {
  HeroBanner,
  Icon3D, ProfIcons,
  ProfessorButton,
  ProfBadge,
  ProfCard, BookCard, StatCard, ContentCard, FeatureCard,
  TabNavigation,
  SectionTitle, PageTitle,
  ProgressBar, CircularProgress,
  FilterSelect, SearchInput,
  GameCard, VideoCard, AudioCard, LivroCard, PlanoCard, QuestaoCard,
  PdfModal, VideoModal, AudioModal, SaveToEstojoModal,
  SavedItemRow, FolderCard,
} from '@/components/professor-ui';

const MOCK_FOLDERS = [
  { id: '1', name: 'Semana 1 — Frações', items: [{ id: 'a' }, { id: 'b' }] },
  { id: '2', name: 'Projetos de Ciências', items: [{ id: 'c' }] },
];

const NOW = new Date().toISOString();
const MOCK_FOLDER_CARD = {
  id: 'f1',
  name: 'Semana 1 — Frações',
  createdAt: NOW,
  items: [
    { id: 'i1', type: 'livro'      as const, color: '', title: 'Matemática — 2° Ano',    discipline: 'Matemática', grade: '2° Ano', savedAt: NOW },
    { id: 'i2', type: 'video'      as const, color: '', title: 'Aula de Frações',         discipline: 'Matemática', grade: '2° Ano', savedAt: NOW },
    { id: 'i3', type: 'audio'      as const, color: '', title: 'Podcast de Revisão',      discipline: 'Português',  grade: '3° Ano', savedAt: NOW },
    { id: 'i4', type: 'plano_aula' as const, color: '', title: 'Plano — Números Naturais', discipline: 'Matemática', grade: '1° Ano', savedAt: NOW },
  ],
};

export default function DesignSystemPage() {
  const [activeTab,    setActiveTab]    = useState('aplicacoes');
  const [search,       setSearch]       = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [folderOpen,   setFolderOpen]   = useState(false);

  // Modal states
  const [showPdf,   setShowPdf]   = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showSave,  setShowSave]  = useState(false);

  const tabs = [
    { id: 'aplicacoes', label: 'Aplicações',      badge: 3 },
    { id: 'questoes',   label: 'Questões' },
    { id: 'alunos',     label: 'Alunos',           badge: 28 },
    { id: 'turmas',     label: 'Turmas' },
    { id: 'fluencia',   label: 'Fluência por Turma' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <HeroBanner
        label="Design System"
        title="Componentes da Plataforma"
        subtitle="Referência visual de todos os componentes disponíveis para o professor."
        illustration="books"
      />

      <div className="px-8 py-8 space-y-14 max-w-[1200px]">

        {/* ── Botões ── */}
        <section className="space-y-4">
          <SectionTitle title="Botões" accent="orange" />
          <div className="flex flex-wrap gap-3 items-center">
            <ProfessorButton variant="primary">Primário</ProfessorButton>
            <ProfessorButton variant="secondary">Secundário</ProfessorButton>
            <ProfessorButton variant="purple">Roxo</ProfessorButton>
            <ProfessorButton variant="pink">Rosa</ProfessorButton>
            <ProfessorButton variant="success">Sucesso</ProfessorButton>
            <ProfessorButton variant="danger">Perigo</ProfessorButton>
            <ProfessorButton variant="ghost">Ghost</ProfessorButton>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ProfessorButton size="xs" variant="primary">Extra Small</ProfessorButton>
            <ProfessorButton size="sm" variant="primary">Small</ProfessorButton>
            <ProfessorButton size="md" variant="primary">Medium</ProfessorButton>
            <ProfessorButton size="lg" variant="primary">Large</ProfessorButton>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ProfessorButton variant="primary" iconLeft={<ProfIcons.Book />}>Com Ícone</ProfessorButton>
            <ProfessorButton variant="secondary" loading>Carregando</ProfessorButton>
            <ProfessorButton variant="primary" disabled>Desabilitado</ProfessorButton>
          </div>
        </section>

        {/* ── Badges ── */}
        <section className="space-y-4">
          <SectionTitle title="Badges" accent="teal" />
          <div className="flex flex-wrap gap-2 items-center">
            <ProfBadge variant="orange">Laranja</ProfBadge>
            <ProfBadge variant="teal">Teal</ProfBadge>
            <ProfBadge variant="purple">Roxo</ProfBadge>
            <ProfBadge variant="pink">Rosa</ProfBadge>
            <ProfBadge variant="green">Verde</ProfBadge>
            <ProfBadge variant="amber">Âmbar</ProfBadge>
            <ProfBadge variant="blue">Azul</ProfBadge>
            <ProfBadge variant="slate">Neutro</ProfBadge>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <ProfBadge variant="matematica" dot>Matemática</ProfBadge>
            <ProfBadge variant="portugues"  dot>Português</ProfBadge>
            <ProfBadge variant="ciencias"   dot>Ciências</ProfBadge>
            <ProfBadge variant="historia"   dot>História</ProfBadge>
            <ProfBadge variant="artes"      dot>Artes</ProfBadge>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <ProfBadge variant="novo"         dot>Novo</ProfBadge>
            <ProfBadge variant="em_progresso" dot>Em Progresso</ProfBadge>
            <ProfBadge variant="concluido"    dot>Concluído</ProfBadge>
            <ProfBadge variant="pendente"     dot>Pendente</ProfBadge>
          </div>
        </section>

        {/* ── Ícones 3D ── */}
        <section className="space-y-4">
          <SectionTitle title="Ícones 3D" accent="purple" />
          <div className="flex flex-wrap gap-4 items-end">
            {(['orange','teal','purple','pink','green','blue','amber'] as const).map(color => (
              <Icon3D key={color} color={color} size="md"><ProfIcons.Book /></Icon3D>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <Icon3D color="orange" size="xs"><ProfIcons.Book /></Icon3D>
            <Icon3D color="teal"   size="sm"><ProfIcons.Game /></Icon3D>
            <Icon3D color="purple" size="md"><ProfIcons.Video /></Icon3D>
            <Icon3D color="pink"   size="lg"><ProfIcons.Chart /></Icon3D>
            <Icon3D color="green"  size="xl"><ProfIcons.Trophy /></Icon3D>
          </div>
        </section>

        {/* ── Hero Banners ── */}
        <section className="space-y-4">
          <SectionTitle title="Hero Banners" accent="orange" />
          <div className="space-y-3 rounded-3xl overflow-hidden">
            <HeroBanner label="Jogos Educacionais" title="Explore os jogos interativos" subtitle="Aprenda brincando com mais de 200 jogos educativos." illustration="games" />
            <HeroBanner label="Relatórios" title="Gestão Educacional" subtitle="Acompanhe o desempenho das suas turmas." illustration="charts" />
          </div>
        </section>

        {/* ── Abas ── */}
        <section className="space-y-4">
          <SectionTitle title="Navegação por Abas" accent="teal" />
          <ProfCard className="overflow-hidden">
            <TabNavigation tabs={tabs} active={activeTab} onChange={setActiveTab} accentColor="orange" className="px-4" />
            <div className="p-6 text-sm text-slate-500 font-semibold">
              Aba ativa: <span className="text-orange-600 font-bold">{activeTab}</span>
            </div>
          </ProfCard>
        </section>

        {/* ── Filtros ── */}
        <section className="space-y-4">
          <SectionTitle title="Filtros" accent="blue" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar conteúdo..." />
            <FilterSelect
              icon={<ProfIcons.Book />}
              placeholder="Componente Curricular"
              options={[
                { value: 'matematica', label: 'Matemática' },
                { value: 'portugues',  label: 'Português' },
                { value: 'ciencias',   label: 'Ciências' },
              ]}
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              accentColor="blue"
            />
            <FilterSelect icon={<ProfIcons.Turma />} placeholder="Turma" options={[{ value: '1a', label: '1° Ano A' }, { value: '2a', label: '2° Ano A' }]} accentColor="blue" />
            <FilterSelect icon={<ProfIcons.Clipboard />} placeholder="Tipo" options={[{ value: 'diagnostica', label: 'Diagnóstica' }, { value: 'formativa', label: 'Formativa' }]} accentColor="blue" />
          </div>
        </section>

        {/* ── Progresso ── */}
        <section className="space-y-4">
          <SectionTitle title="Barras de Progresso" accent="teal" />
          <ProfCard className="p-6 space-y-4">
            <ProgressBar value={100} color="green"  size="sm" label="Matemática — Turma 2A" showValue />
            <ProgressBar value={72}  color="orange" size="sm" label="Português — Turma 2A"  showValue />
            <ProgressBar value={45}  color="purple" size="sm" label="Ciências — Turma 3B"   showValue />
            <ProgressBar value={28}  color="teal"   size="md" label="História — Turma 1A"   showValue />
          </ProfCard>
          <div className="flex flex-wrap gap-6 items-center">
            {([25,50,75,100] as const).map(v => (
              <CircularProgress key={v} value={v} color="orange">
                <span className="text-[13px] font-extrabold text-slate-700">{v}%</span>
              </CircularProgress>
            ))}
            <CircularProgress value={82} color="teal" size={96} strokeWidth={9}>
              <span className="text-[15px] font-extrabold text-slate-700">82%</span>
            </CircularProgress>
          </div>
        </section>

        {/* ── Stat Cards ── */}
        <section className="space-y-4">
          <SectionTitle title="Cards de Métricas" accent="orange" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Alunos Ativos"  value="28"  iconColor="orange" icon={<ProfIcons.Turma />}     trend={{ value: '+3 esta semana', up: true }} />
            <StatCard label="Atividades"      value="12"  iconColor="teal"   icon={<ProfIcons.Clipboard />} trend={{ value: '4 pendentes',    up: false }} />
            <StatCard label="Média da Turma"  value="7.4" iconColor="purple" icon={<ProfIcons.Chart />}     trend={{ value: '+0.3 vs mês ant.', up: true }} />
            <StatCard label="Conquistas"      value="94"  iconColor="amber"  icon={<ProfIcons.Trophy />} />
          </div>
        </section>

        {/* ── Feature + Book Cards ── */}
        <section className="space-y-4">
          <SectionTitle title="Cards de Funcionalidade" accent="teal" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard title="Biblioteca de Livros" description="Acesse todos os livros didáticos disponíveis." icon={<ProfIcons.Book />} iconColor="blue" onClick={() => {}} />
            <FeatureCard title="Jogos Educacionais"   description="Mais de 200 jogos interativos alinhados à BNCC." icon={<ProfIcons.Game />} iconColor="purple" onClick={() => {}} />
            <FeatureCard title="Vídeo-Aulas"          description="Conteúdo audiovisual para complementar o aprendizado." icon={<ProfIcons.Video />} iconColor="pink" onClick={() => {}} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <BookCard title="Matemática — 2° Ano" badge="Novo"  color="blue"   coverIcon={<ProfIcons.Book />} />
            <BookCard title="Português — 3° Ano"  badge="Ativo" color="pink"   coverIcon={<ProfIcons.Book />} />
            <BookCard title="Ciências — 1° Ano"               color="green"  coverIcon={<ProfIcons.Book />} />
            <BookCard title="História — 4° Ano"   badge="BNCC" color="amber"  coverIcon={<ProfIcons.Book />} />
            <BookCard title="Artes — 2° Ano"                  color="purple" coverIcon={<ProfIcons.Book />} />
          </div>
        </section>

        {/* ── Content List Cards ── */}
        <section className="space-y-4">
          <SectionTitle title="Lista de Conteúdo" accent="blue" />
          <div className="space-y-2">
            <ContentCard title="Avaliação Diagnóstica de Matemática — 2° Ano" subtitle="Ensino Fundamental — Anos Iniciais" meta="5/5 respostas inseridas" progress={100} progressColor="green" badge={<ProfBadge variant="concluido" dot>Concluído</ProfBadge>} onClick={() => {}} />
            <ContentCard title="Avaliação Diagnóstica de Português — 3° Ano"  subtitle="Ensino Fundamental — Anos Iniciais" meta="3/5 respostas inseridas" progress={60}  progressColor="orange" badge={<ProfBadge variant="em_progresso" dot>Em Progresso</ProfBadge>} onClick={() => {}} />
            <ContentCard title="Tabela de Fluência — 1° Ano A" subtitle="Leitura oral — Avaliação mensal" meta="0/5 respostas inseridas" progress={0} progressColor="teal" badge={<ProfBadge variant="pendente" dot>Pendente</ProfBadge>} onClick={() => {}} />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            CARDS DE CONTEÚDO DO ACERVO
        ════════════════════════════════════════════════════ */}

        {/* ── GameCard ── */}
        <section className="space-y-4">
          <SectionTitle title="GameCard — Jogos Educacionais" accent="purple" subtitle="Componente: GameCard · Props: GameCardData" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <GameCard title="Tabuada dos Campeões" discipline="Matemática" grade="3° Ano" difficulty="Fácil"   engine="HTML5" pcdSign saved />
            <GameCard title="Aventura Gramatical"  discipline="Português"  grade="2° Ano" difficulty="Médio"   engine="Unity" />
            <GameCard title="Mundo das Ciências"   discipline="Ciências"   grade="4° Ano" difficulty="Difícil" engine="HTML5" pcdVoice />
            <GameCard title="Cronologia da História" discipline="História"  grade="5° Ano" difficulty="Médio" />
            <GameCard title="Jogo sem thumbnail"   discipline="Geografia"  grade="1° Ano" difficulty="Fácil" />
          </div>
        </section>

        {/* ── VideoCard ── */}
        <section className="space-y-4">
          <SectionTitle title="VideoCard — Vídeos e Videoaulas" accent="purple" subtitle="Componente: VideoCard · Props: VideoCardData" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <VideoCard title="Introdução às Frações" discipline="Matemática" grade="3° Ano" duration="12:34" sourceType="link"   saved />
            <VideoCard title="Interpretação de Textos" discipline="Português" grade="4° Ano" duration="08:20" sourceType="upload" />
            <VideoCard title="O Sistema Solar"        discipline="Ciências"  grade="5° Ano" duration="15:00" sourceType="link" />
            <VideoCard title="Era das Navegações"     discipline="História"  grade="6° Ano" duration="20:10" sourceType="upload" />
            <VideoCard title="Biomas do Brasil"       discipline="Geografia" grade="7° Ano" duration="09:45" sourceType="link" />
          </div>
        </section>

        {/* ── AudioCard ── */}
        <section className="space-y-4">
          <SectionTitle title="AudioCard — Áudios e Podcasts" accent="purple" subtitle="Componente: AudioCard · Props: AudioCardData" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <AudioCard title="Podcast: Matemática no Dia a Dia" discipline="Matemática" grade="3° Ano" duration="18:00" tipo="Podcast" saved />
            <AudioCard title="Leitura Dramática — O Cortiço"    discipline="Português"  grade="8° Ano" duration="24:30" tipo="Leitura" />
            <AudioCard title="Sons da Natureza — Ciências"      discipline="Ciências"   grade="4° Ano" duration="10:15" tipo="Podcast" />
            <AudioCard title="Entrevista com Historiador"        discipline="História"   grade="9° Ano" duration="32:00" tipo="Entrevista" />
            <AudioCard title="Áudio sem thumbnail"              discipline="Geografia"  grade="6° Ano" duration="05:20" tipo="Podcast" />
          </div>
        </section>

        {/* ── LivroCard ── */}
        <section className="space-y-4">
          <SectionTitle title="LivroCard — Biblioteca" accent="blue" subtitle="Componente: LivroCard · Props: LivroCardData" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <LivroCard title="Matemática — 2° Ano" discipline="Matemática" grade="2° Ano" description="Livro completo de matemática para o 2° ano." isNew canDownload fileUrl="#" saved />
            <LivroCard title="Português — 3° Ano"  discipline="Português"  grade="3° Ano" description="Gramática e interpretação de textos." fileUrl="#" />
            <LivroCard title="Ciências — 4° Ano"   discipline="Ciências"   grade="4° Ano" description="Exploração do mundo natural." canDownload fileUrl="#" />
            <LivroCard title="História — 5° Ano"   discipline="História"   grade="5° Ano" description="Do Brasil colonial à atualidade." isNew fileUrl="#" />
            <LivroCard title="Livro sem arquivo"   discipline="Geografia"  grade="1° Ano" description="Sem PDF vinculado ainda." />
          </div>
        </section>

        {/* ── PlanoCard ── */}
        <section className="space-y-4">
          <SectionTitle title="PlanoCard — Acervo Pedagógico" accent="orange" subtitle="Componente: PlanoCard · Props: PlanoCardData" />
          <div className="space-y-3">
            <PlanoCard title="Introdução a Números Naturais" description="Explorar os conceitos iniciais de numeração com atividades práticas." discipline="Matemática" grade="1° Ano" tipodoc="plano_aula" bnccSkill="EF01MA01" canDownload saved onView={() => {}} onDownload={() => {}} />
            <PlanoCard title="Sequência: Leitura e Interpretação" description="Cinco aulas progressivas de compreensão leitora." discipline="Português" grade="3° Ano" tipodoc="sequencia_didatica" bnccSkill="EF03LP01" onView={() => {}} />
            <PlanoCard title="Material de Apoio — Revolução Industrial" description="Slides e atividades complementares." discipline="História" grade="8° Ano" tipodoc="material_diverso" canDownload onView={() => {}} onDownload={() => {}} />
          </div>
        </section>

        {/* ── QuestaoCard ── */}
        <section className="space-y-4">
          <SectionTitle title="QuestaoCard — Banco de Questões" accent="teal" subtitle="Componente: QuestaoCard · Props: QuestaoCardData" />
          <div className="space-y-3">
            <QuestaoCard statement="Qual é o resultado de 3/4 + 1/4?" discipline="Matemática" grade="4° Ano" difficulty="Fácil" type="multiple_choice" origin="system" bnccSkill="EF04MA08" year={2023} source="SAEB" saved />
            <QuestaoCard statement="Identifique o sujeito e o predicado na oração: 'Os alunos estudaram muito para a prova.'" discipline="Português" grade="6° Ano" difficulty="Médio" type="discursive" origin="custom" />
            <QuestaoCard statement="Explique o processo de fotossíntese e sua importância para os ecossistemas terrestres." discipline="Ciências" grade="7° Ano" difficulty="Difícil" type="discursive" origin="system" bnccSkill="EF07CI07" year={2022} source="ENEM" />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            MODAIS
        ════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionTitle title="Modais" accent="orange" subtitle="PdfModal · VideoModal · AudioModal · SaveToEstojoModal" />
          <div className="flex flex-wrap gap-3">
            <ProfessorButton variant="primary"   onClick={() => setShowPdf(true)}>Abrir PdfModal</ProfessorButton>
            <ProfessorButton variant="secondary" onClick={() => setShowVideo(true)}>Abrir VideoModal</ProfessorButton>
            <ProfessorButton variant="purple"    onClick={() => setShowAudio(true)}>Abrir AudioModal</ProfessorButton>
            <ProfessorButton variant="ghost"     onClick={() => setShowSave(true)}>Abrir SaveToEstojoModal</ProfessorButton>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            ESTOJO — SavedItemRow e FolderCard
        ════════════════════════════════════════════════════ */}

        {/* ── SavedItemRow ── */}
        <section className="space-y-4">
          <SectionTitle title="SavedItemRow — Item do Estojo" accent="orange" subtitle="Componente: SavedItemRow" />
          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <SavedItemRow item={{ id: 'r1', type: 'livro',      color: '', title: 'Matemática — 2° Ano',             discipline: 'Matemática', grade: '2° Ano', savedAt: NOW, fileUrl: '#' }} onRemove={() => {}} onView={() => {}} onWatch={() => {}} onPlay={() => {}} />
            <SavedItemRow item={{ id: 'r2', type: 'video',      color: '', title: 'Aula de Frações',                  discipline: 'Matemática', grade: '3° Ano', savedAt: NOW }}              onRemove={() => {}} onView={() => {}} onWatch={() => {}} onPlay={() => {}} />
            <SavedItemRow item={{ id: 'r3', type: 'audio',      color: '', title: 'Podcast: Matemática no Dia a Dia', discipline: 'Matemática', grade: '4° Ano', savedAt: NOW }}              onRemove={() => {}} onView={() => {}} onWatch={() => {}} onPlay={() => {}} />
            <SavedItemRow item={{ id: 'r4', type: 'jogo',       color: '', title: 'Tabuada dos Campeões',             discipline: 'Matemática', grade: '2° Ano', savedAt: NOW, fileUrl: '#' }} onRemove={() => {}} onView={() => {}} onWatch={() => {}} onPlay={() => {}} />
            <SavedItemRow item={{ id: 'r5', type: 'plano_aula', color: '', title: 'Plano — Números Naturais',         discipline: 'Matemática', grade: '1° Ano', savedAt: NOW, fileUrl: '#' }} onRemove={() => {}} onView={() => {}} onWatch={() => {}} onPlay={() => {}} />
          </div>
        </section>

        {/* ── FolderCard ── */}
        <section className="space-y-4">
          <SectionTitle title="FolderCard — Pasta do Estojo" accent="orange" subtitle="Componente: FolderCard" />
          <FolderCard
            folder={MOCK_FOLDER_CARD}
            isOpen={folderOpen}
            onToggle={() => setFolderOpen(v => !v)}
            onDelete={() => {}}
            onRename={() => {}}
            onRemoveItem={() => {}}
            onView={() => {}}
            onWatch={() => {}}
            onPlay={() => {}}
          />
        </section>

        {/* ── Titles ── */}
        <section className="space-y-4">
          <SectionTitle title="Títulos de Seção" accent="none" />
          <div className="space-y-3">
            <SectionTitle title="Com Acento Laranja" accent="orange" />
            <SectionTitle title="Com Acento Teal"    accent="teal" />
            <SectionTitle title="Com Acento Roxo"    accent="purple" />
            <SectionTitle title="Com Subtítulo e Ação" subtitle="Exibindo os dados da turma selecionada." accent="orange" actions={<ProfessorButton size="sm" variant="ghost">Ver todos</ProfessorButton>} />
            <PageTitle
              title="Título de Página"
              subtitle="Subtítulo descritivo da página atual"
              breadcrumb={[{ label: 'Professor' }, { label: 'Biblioteca' }, { label: 'Livros' }]}
              actions={<ProfessorButton variant="primary" iconLeft={<ProfIcons.Book />}>Novo Livro</ProfessorButton>}
            />
          </div>
        </section>

        {/* ── Paleta ── */}
        <section className="space-y-4 pb-8">
          <SectionTitle title="Paleta de Cores" accent="orange" />
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Primary Orange',  cls: 'bg-orange-500' },
              { label: 'Secondary Teal',  cls: 'bg-teal-500' },
              { label: 'Accent Purple',   cls: 'bg-purple-500' },
              { label: 'Accent Pink',     cls: 'bg-pink-500' },
              { label: 'Success Green',   cls: 'bg-green-500' },
              { label: 'Warning Amber',   cls: 'bg-amber-500' },
              { label: 'Info Blue',       cls: 'bg-blue-500' },
              { label: 'Neutral Slate',   cls: 'bg-slate-500' },
            ].map(({ label, cls }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className={`w-14 h-14 rounded-2xl ${cls} shadow-md`} />
                <span className="text-[10px] font-bold text-slate-500 text-center leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ── Modais ── */}
      {showPdf && (
        <PdfModal
          title="Matemática — 2° Ano"
          url="https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf"
          discipline="Matemática"
          grade="2° Ano"
          description="Livro completo de matemática para o segundo ano do ensino fundamental."
          onClose={() => setShowPdf(false)}
        />
      )}
      {showVideo && (
        <VideoModal
          title="Introdução às Frações"
          fileUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          discipline="Matemática"
          grade="3° Ano"
          duration="12:34"
          onClose={() => setShowVideo(false)}
        />
      )}
      {showAudio && (
        <AudioModal
          title="Podcast: Matemática no Dia a Dia"
          fileUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          discipline="Matemática"
          grade="4° Ano"
          duration="18:00"
          onClose={() => setShowAudio(false)}
        />
      )}
      {showSave && (
        <SaveToEstojoModal
          itemTitle="Introdução às Frações — Videoaula"
          folders={MOCK_FOLDERS}
          onClose={() => setShowSave(false)}
          onSave={() => setShowSave(false)}
          onCreateAndSave={() => setShowSave(false)}
        />
      )}
    </div>
  );
}
