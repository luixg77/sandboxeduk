'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud, CheckCircle, AlertCircle, X, Loader2,
  FileJson, Clock, BarChart3, ArrowRight, Download
} from 'lucide-react';
import Button from '@/components/ui/Button';

// ─── Tipos ───────────────────────────────────────────────────────
interface ImportResult {
  processed: number;
  inserted: number;
  ignored: number;
  skippedByValidation: number;
  skippedReasons: Record<string, number>;
  batchId: string;
  disciplineBreakdown: Record<string, number>;
}

interface ChunkProgress {
  currentChunk: number;
  totalChunks: number;
  questionsProcessed: number;
  questionsTotal: number;
  insertedSoFar: number;
  ignoredSoFar: number;
  elapsedMs: number;
  disciplineBreakdown: Record<string, number>;
}

type ModalStep = 'upload' | 'processing' | 'result';

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
const CHUNK_SIZE = 200;
const CHUNK_DELAY_MS = 400;

// ─── Helpers ────────────────────────────────────────────────────
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Componente Principal ────────────────────────────────────────
export function ImportQuestionsModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<ModalStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ChunkProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset ao fechar ──
  const handleClose = useCallback(() => {
    setStep('upload');
    setFile(null);
    setFileError(null);
    setProgress(null);
    setResult(null);
    setFatalError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // ── Validação de arquivo ──
  const validateAndSetFile = (f: File) => {
    setFileError(null);
    if (!f.name.endsWith('.json') && f.type !== 'application/json') {
      setFileError('Apenas arquivos .json são aceitos.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`O arquivo excede o limite de ${formatFileSize(MAX_FILE_SIZE)}. Tamanho: ${formatFileSize(f.size)}`);
      return;
    }
    setFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) validateAndSetFile(e.dataTransfer.files[0]);
  };

  // ── Motor de Importação (Client-Side Chunking) ──
  const startImport = async () => {
    if (!file) return;
    setStep('processing');
    setFatalError(null);

    const batchId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // 1. Ler o arquivo no navegador
      const text = await file.text();
      let parsedData: any[] = JSON.parse(text);
      
      if (!Array.isArray(parsedData)) throw new Error("O JSON raiz deve ser um array.");
      


      // Filtrar apenas registros válidos (ignora headers PHPMyAdmin e valida formatos base/legado/atheva)
      const validQuestions = parsedData.filter((item: any) => item.statement || item.descricao || item.question);

      if (validQuestions.length === 0) {
        setFatalError('Nenhuma questão válida encontrada no arquivo. Verifique o formato.');
        return;
      }

      const totalChunks = Math.ceil(validQuestions.length / CHUNK_SIZE);
      let totalInserted = 0;
      let totalIgnored = 0;
      let totalSkippedByValidation = 0;
      const mergedBreakdown: Record<string, number> = {};
      const mergedSkippedReasons: Record<string, number> = {};

      // 2. Processar em lotes com delay
      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const chunkQuestions = validQuestions.slice(
          chunkIdx * CHUNK_SIZE,
          (chunkIdx + 1) * CHUNK_SIZE
        );

        // Atualizar progresso antes do envio
        setProgress({
          currentChunk: chunkIdx + 1,
          totalChunks,
          questionsProcessed: chunkIdx * CHUNK_SIZE,
          questionsTotal: validQuestions.length,
          insertedSoFar: totalInserted,
          ignoredSoFar: totalIgnored,
          elapsedMs: Date.now() - startTime,
          disciplineBreakdown: { ...mergedBreakdown },
        });

        // 3. Enviar lote para o backend
        const res = await fetch('/api/admin/questions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            questions: chunkQuestions,
            batchId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setFatalError(data.error || `Erro no lote ${chunkIdx + 1}: ${res.statusText}`);
          return;
        }

        // 4. Acumular resultados
        totalInserted += data.inserted || 0;
        totalIgnored += data.ignored || 0;
        totalSkippedByValidation += data.skippedByValidation || 0;
        if (data.disciplineBreakdown) {
          Object.entries(data.disciplineBreakdown).forEach(([name, count]) => {
            mergedBreakdown[name] = (mergedBreakdown[name] || 0) + (count as number);
          });
        }
        if (data.skippedReasons) {
          Object.entries(data.skippedReasons).forEach(([reason, count]) => {
            mergedSkippedReasons[reason] = (mergedSkippedReasons[reason] || 0) + (count as number);
          });
        }

        // Atualizar progresso após o envio
        setProgress({
          currentChunk: chunkIdx + 1,
          totalChunks,
          questionsProcessed: Math.min((chunkIdx + 1) * CHUNK_SIZE, validQuestions.length),
          questionsTotal: validQuestions.length,
          insertedSoFar: totalInserted,
          ignoredSoFar: totalIgnored,
          elapsedMs: Date.now() - startTime,
          disciplineBreakdown: { ...mergedBreakdown },
        });

        // 5. Delay entre lotes
        if (chunkIdx < totalChunks - 1) {
          await sleep(CHUNK_DELAY_MS);
        }
      }

      // 6. Resultado final
      setResult({
        processed: validQuestions.length,
        inserted: totalInserted,
        ignored: totalIgnored,
        skippedByValidation: totalSkippedByValidation,
        skippedReasons: mergedSkippedReasons,
        batchId,
        disciplineBreakdown: mergedBreakdown,
      });
      setStep('result');
      if (onSuccess) onSuccess();

    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setFatalError('O arquivo não contém JSON válido. Verifique a estrutura.');
      } else {
        setFatalError(err.message || 'Erro desconhecido durante a importação.');
      }
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        statement: '<p>Qual a capital do Brasil?</p>',
        discipline: 'Geografia',
        subject: 'Geopolítica',
        bncc_skill: 'EM13CHS201',
        difficulty: 'easy',
        status: 'active',
        year: 2024,
        comment: 'Revisão básica',
        answer_key: 'B',
        alternatives: {
          A: 'São Paulo',
          B: 'Brasília',
          C: 'Rio de Janeiro',
          D: 'Belo Horizonte',
          E: 'Salvador'
        }
      }
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eduk_template_questoes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Cálculos de progresso ──
  const pct = progress
    ? Math.round((progress.questionsProcessed / progress.questionsTotal) * 100)
    : 0;

  const estimatedRemaining = progress && progress.questionsProcessed > 0
    ? ((progress.elapsedMs / progress.questionsProcessed) * (progress.questionsTotal - progress.questionsProcessed))
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-white" />
            </div>
            Importação em Lote
          </h2>
          <button
            onClick={handleClose}
            disabled={step === 'processing' && !fatalError}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 rounded-full hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">

          {/* ═══ STEP 1: Upload ═══ */}
          {step === 'upload' && (
            <>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
                  ${file ? 'border-purple-400 bg-purple-50/50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'}`}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={(e) => { if (e.target.files?.length) validateAndSetFile(e.target.files[0]); }}
                />

                {file ? (
                  <FileJson className="w-12 h-12 text-purple-500 mb-3" />
                ) : (
                  <UploadCloud className="w-12 h-12 text-gray-300 group-hover:text-purple-400 transition-colors mb-3" />
                )}

                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {file ? file.name : 'Arraste seu arquivo JSON aqui'}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {file
                    ? `${formatFileSize(file.size)} — pronto para importar`
                    : 'ou clique para selecionar. Limite: 40MB'}
                </p>

                {file && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Remover arquivo
                  </button>
                )}
              </div>

              {fileError && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{fileError}</p>
                </div>
              )}

              {/* Botão de Download do Template */}
              <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Novo por aqui?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Baixe nosso template JSON padrão.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar Template
                </button>
              </div>

              {/* Informações sobre o processo */}
              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Como funciona</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    ['Leitura local', 'O arquivo é lido no seu navegador, sem envio bruto.'],
                    ['Lotes de 200', 'Questões são enviadas em pacotes para o servidor.'],
                    ['Idempotência', 'Duplicatas são detectadas e ignoradas automaticamente.'],
                    ['Checkpoint', 'Cada lote recebe um ID único para rastreio futuro.'],
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-black">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{title}</p>
                        <p className="text-[11px] text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ STEP 2: Processing ═══ */}
          {step === 'processing' && (
            <div className="space-y-5">
              {/* Fatal error durante processamento */}
              {fatalError ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-semibold mb-1">Erro na Importação</h4>
                    <p className="text-sm text-red-600">{fatalError}</p>
                    {progress && (
                      <p className="text-xs text-red-400 mt-2">
                        Progresso antes do erro: {progress.questionsProcessed}/{progress.questionsTotal} questões
                        — {progress.insertedSoFar} inseridas com sucesso.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Spinner + Progresso */}
                  <div className="text-center pt-2">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-900">Importando questões...</h3>
                    {progress && (
                      <p className="text-sm text-gray-500 mt-1">
                        Lote {progress.currentChunk} de {progress.totalChunks}
                      </p>
                    )}
                  </div>

                  {/* Barra */}
                  {progress && (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{progress.questionsProcessed.toLocaleString()} de {progress.questionsTotal.toLocaleString()} questões</span>
                          <span className="font-semibold text-purple-600">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Decorrido: {formatTime(progress.elapsedMs)}
                          </span>
                          {estimatedRemaining > 0 && (
                            <span>Restante: ~{formatTime(estimatedRemaining)}</span>
                          )}
                        </div>
                      </div>

                      {/* Contadores em tempo real */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Inseridas</p>
                          <p className="text-xl font-bold text-green-700">{progress.insertedSoFar.toLocaleString()}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Ignoradas</p>
                          <p className="text-xl font-bold text-amber-700">{progress.ignoredSoFar.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Breakdown por disciplina (em tempo real) */}
                      {Object.keys(progress.disciplineBreakdown).length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                            <BarChart3 className="w-3 h-3" />
                            Distribuição por Disciplina
                          </h4>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {Object.entries(progress.disciplineBreakdown)
                              .sort(([, a], [, b]) => b - a)
                              .map(([name, count]) => (
                                <div key={name} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-700 font-medium truncate max-w-[200px]">{name}</span>
                                  <span className="text-purple-600 font-bold tabular-nums">{count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Result ═══ */}
          {step === 'result' && result && (
            <div className="space-y-5">
              <div className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Processamento Finalizado</h3>
                <p className="text-xs text-gray-500 mt-1.5 font-medium">
                  Batch ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono text-gray-600">{result.batchId}</code>
                </p>
              </div>

              {/* Métricas Finais em Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Lidas</p>
                  <p className="text-2xl font-black text-gray-900">{result.processed.toLocaleString()}</p>
                </div>
                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1.5">Salvas</p>
                  <p className="text-2xl font-black text-green-700">{result.inserted.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Ignoradas</p>
                  <p className="text-2xl font-black text-amber-700">{result.ignored.toLocaleString()}</p>
                </div>
              </div>

              {/* Seção de Sucesso - Disciplinas */}
              {result.inserted > 0 && Object.keys(result.disciplineBreakdown).length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Resumo de Inserção por Disciplina
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {Object.keys(result.disciplineBreakdown).length} Categorias
                    </span>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(result.disciplineBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([name, count]) => {
                        const widthPct = Math.max(3, (count / result.inserted) * 100);
                        return (
                          <div key={name} className="group">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-700 font-bold truncate max-w-[280px]">{name}</span>
                              <span className="text-green-600 font-black tabular-nums">{count.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Seção de Rejeição - Motivos */}
              {result.ignored > 0 && (
                <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5">
                   <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Questões Rejeitadas (Motivos)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(result.skippedReasons).length > 0 ? (
                      Object.entries(result.skippedReasons)
                        .sort(([, a], [, b]) => b - a)
                        .map(([reason, count]) => (
                          <div key={reason} className="flex items-center justify-between p-2.5 bg-white border border-rose-50 rounded-xl shadow-sm">
                            <span className="text-xs text-rose-800 font-bold leading-tight">{reason}</span>
                            <span className="bg-rose-100 text-rose-700 font-black px-2.5 py-1 rounded-lg text-[11px] tabular-nums min-w-[32px] text-center">
                              {count.toLocaleString()}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-2">
                         <p className="text-xs text-gray-400 italic">Ignoradas por duplicidade de conteúdo ou erro sistêmico.</p>
                      </div>
                    )}
                  </div>
                  {result.skippedByValidation > 0 && (
                    <p className="text-[10px] text-rose-400 mt-4 leading-relaxed bg-white/50 p-2 rounded-lg border border-rose-50">
                      <strong>Atenção:</strong> Questões rejeitadas por validação não foram salvas. Revise o arquivo JSON para garantir que todos os campos obrigatórios (enunciado, comentário, alternativas/gabarito) estejam presentes.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between rounded-b-2xl border-t border-gray-100">
          <div className="text-[11px] text-gray-400">
            {step === 'upload' && file && `Pronto: ${formatFileSize(file.size)}`}
            {step === 'processing' && !fatalError && 'Não feche esta janela...'}
            {step === 'result' && 'Questões disponíveis no banco'}
          </div>
          <div className="flex gap-2.5">
            {(step === 'upload' || step === 'result' || fatalError) && (
              <Button variant="ghost" onClick={handleClose}>
                {step === 'result' ? 'Fechar' : 'Cancelar'}
              </Button>
            )}
            {step === 'upload' && (
              <Button
                variant="primary"
                className="!bg-purple-600 hover:!bg-purple-700 !text-white min-w-[160px]"
                onClick={startImport}
                disabled={!file}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Iniciar Importação
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
