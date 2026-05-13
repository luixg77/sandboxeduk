import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// ─── Auth Helper: extract session from request cookies ────────
async function getAuthenticatedUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // API routes don't need to set cookies — session refresh
          // happens in middleware.ts
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// ─── Service-role client — bypasses RLS for bulk import ───────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// ─── Legacy Mapping Dictionary ────────────────────────────────
function loadLegacyMappingDict() {
  const relativePath = path.resolve(process.cwd(), '../backend/scripts/support_maps.json');
  try {
    if (fs.existsSync(relativePath)) return JSON.parse(fs.readFileSync(relativePath, 'utf8'));
  } catch { /* skip */ }
  return { disciplines: {}, subjects: {}, skills: {}, competencies: {} };
}

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMAS — O "Fiscal" que substitui todos os if/else
// ═══════════════════════════════════════════════════════════════

// Schema para uma alternativa normalizada (pós-adapter)
const AlternativeSchema = z.object({
  letter: z.coerce.string().min(1).max(1).transform(v => v.toUpperCase()),
  text: z.coerce.string(),
  is_correct: z.boolean().default(false),
});

// Schema para uma questão normalizada (pós-adapter, pré-persistência)
const NormalizedQuestionSchema = z.object({
  statement: z.coerce.string().min(2, 'Enunciado muito curto'),
  comment: z.coerce.string().min(1, 'Comentário/Gabarito obrigatório'),
  type: z.enum(['multiple_choice', 'discursive']),
  alternatives: z.array(AlternativeSchema).default([]),
  answerKey: z.coerce.string().nullable(),
  discId: z.string().nullable().optional(),
  subId: z.string().nullable().optional(),
  skillId: z.string().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  origin: z.enum(['system', 'custom']).default('system'),
  year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  source: z.coerce.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  referenceId: z.coerce.string().nullable().optional(),
}).refine(
  // MC questions must have ≥2 alternatives and at least one correct
  (q) => {
    if (q.type === 'multiple_choice') {
      return q.alternatives.length >= 2 && q.alternatives.some(a => a.is_correct);
    }
    return true;
  },
  { message: 'Múltipla escolha requer ≥2 alternativas e ao menos 1 correta' }
);

type NormalizedQuestion = z.infer<typeof NormalizedQuestionSchema>;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// ─── Hash MD5 Generator ───────────────────────────────────────
function generateImportHash(statement: string, answerKey: string | null, comment: string | null): string {
  const normalizedStatement = statement
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  let payload = `${normalizedStatement}|${(answerKey || '').toUpperCase()}`;
  if (!answerKey && comment) {
    const normalizedComment = comment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    payload += `|${normalizedComment}`;
  }

  return crypto.createHash('md5').update(payload, 'utf8').digest('hex');
}

function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  let previous = '';
  let current = text;
  
  // Roda até 3 vezes para pegar casos de escapes duplos ou triplos (ex: &amp;lt;p&amp;gt;)
  let loops = 0;
  while (current !== previous && loops < 3) {
    previous = current;
    current = current
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
    loops++;
  }
  return current;
}

function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  const decoded = decodeHTMLEntities(html);
  return decoded.replace(/\sstyle="[^"]*"/gi, '').trim();
}

// ─── Determine question type based on valid alternatives ──────
function classifyQuestionType(alts: { letter: string; text: string; is_correct: boolean }[]): 'multiple_choice' | 'discursive' {
  const validAlts = alts.filter(a => {
    const textContent = a.text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
    return textContent.length > 0;
  });
  return validAlts.length > 0 ? 'multiple_choice' : 'discursive';
}

// ═══════════════════════════════════════════════════════════════
// FORMAT ADAPTERS — Normalizam JSON de qualquer formato
// ═══════════════════════════════════════════════════════════════

interface LookupTables {
  discDbByName: Record<string, string>;
  discDbById: Set<string>;
  subDbByName: Record<string, string>;
  subDbById: Set<string>;
  skillDbByCode: Record<string, string>;
  skillDbById: Set<string>;
  legacyMap: any;
}

function adaptAthevaFormat(q: any, lookups: LookupTables): Partial<NormalizedQuestion> {
  const statement = q.question || '';
  let discId = null;
  let subId = null;
  let skillId = null;
  const metadata: Record<string, any> = {};
  const alts: { letter: string; text: string; is_correct: boolean }[] = [];
  let answerKey: string | null = null;

  // Classification parsing
  const classificationStr = q.classifications?.[0]?.classification || '';
  const parts = classificationStr.split('>');
  if (parts.length > 1) {
    const discName = parts[1].trim().toLowerCase();
    if (lookups.discDbByName[discName]) discId = lookups.discDbByName[discName];
  }
  if (parts.length > 2) {
    const subName = parts[2].trim().toLowerCase();
    if (lookups.subDbByName[subName]) subId = lookups.subDbByName[subName];
  }

  // BNCC Skills
  if (q.skills) {
    for (const [code, desc] of Object.entries(q.skills)) {
      const cleanCode = String(code).toLowerCase().trim();
      if (lookups.skillDbByCode[cleanCode]) skillId = lookups.skillDbByCode[cleanCode];
      metadata.bncc_skill_code = code;
      metadata.bncc_skill_description = desc;
    }
  }

  // Difficulty mapping
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (q.difficulty === 1) difficulty = 'easy';
  else if (q.difficulty === 3) difficulty = 'hard';

  // Alternatives
  if (q.alternatives && Array.isArray(q.alternatives)) {
    for (const alt of q.alternatives) {
      const letter = String(alt.letter).toUpperCase();
      alts.push({
        letter,
        text: String(alt.answer_txt || alt.answer_img || ''),
        is_correct: alt.correct_answer === true
      });
      if (alt.correct_answer) answerKey = letter;
    }
  }

  // Extra metadata
  if (q.exam) metadata.board = q.exam;
  if (q.platform) metadata.platform = q.platform;
  if (q.keywords) metadata.keywords = q.keywords;

  return {
    statement,
    comment: q.questionAnswer || q.pedagogyJustify || '',
    alternatives: alts,
    answerKey,
    discId,
    subId,
    skillId,
    difficulty,
    status: q.status === 1 ? 'active' : 'inactive',
    origin: q.source === 'Base' ? 'system' : 'custom',
    year: q.examEdition ? (parseInt(q.examEdition, 10) || null) : null,
    source: null,
    metadata,
    referenceId: q.id || q.referenceId || q.identificador || null,
  };
}

function adaptNewTemplateFormat(q: any, lookups: LookupTables): Partial<NormalizedQuestion> {
  const alts: { letter: string; text: string; is_correct: boolean }[] = [];
  const answerKey = q.answer_key ? String(q.answer_key).toUpperCase() : null;

  if (q.alternatives && typeof q.alternatives === 'object') {
    for (const [letter, text] of Object.entries(q.alternatives)) {
      alts.push({
        letter: letter.toUpperCase(),
        text: String(text),
        is_correct: letter.toUpperCase() === answerKey
      });
    }
  }

  return {
    statement: q.statement || '',
    comment: q.comment || '',
    alternatives: alts,
    answerKey,
    discId: q.discipline ? (lookups.discDbByName[String(q.discipline).toLowerCase().trim()] || null) : null,
    subId: q.subject ? (lookups.subDbByName[String(q.subject).toLowerCase().trim()] || null) : null,
    skillId: q.bncc_skill ? (lookups.skillDbByCode[String(q.bncc_skill).toLowerCase().trim()] || null) : null,
    difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
    status: (['active', 'inactive', 'draft'].includes(q.status) ? q.status : 'active') as 'active' | 'inactive' | 'draft',
    origin: q.origin === 'system' ? 'system' : 'custom',
    year: q.year ? (parseInt(q.year, 10) || null) : null,
    source: q.source || null,
    metadata: q.metadata || {},
    referenceId: q.id || q.referenceId || q.identificador || null,
  };
}

function adaptLegacyFormat(q: any, lookups: LookupTables): Partial<NormalizedQuestion> {
  const answerKey = q.rgabarito ? String(q.rgabarito).toUpperCase() : null;
  const alts: { letter: string; text: string; is_correct: boolean }[] = [];

  const altFields = [q.ra, q.rb, q.rc, q.rd, q.re];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  altFields.forEach((text, i) => {
    if (text) alts.push({ letter: letters[i], text, is_correct: letters[i] === answerKey });
  });

  const legacyDiscUuid = lookups.legacyMap.disciplines[q.id_materia] || null;
  const discId = legacyDiscUuid && lookups.discDbById.has(legacyDiscUuid) ? legacyDiscUuid : null;
  const legacySubUuid = lookups.legacyMap.subjects[q.id_assunto] || null;
  const subId = legacySubUuid && lookups.subDbById.has(legacySubUuid) ? legacySubUuid : null;

  return {
    statement: q.descricao || '',
    comment: q.comentario || '',
    alternatives: alts,
    answerKey,
    discId,
    subId,
    skillId: null,
    difficulty: (q.dificuldade === 'Fácil' ? 'easy' : q.dificuldade === 'Difícil' ? 'hard' : 'medium') as 'easy' | 'medium' | 'hard',
    status: (q.status === 'Inativo' ? 'inactive' : 'active') as 'active' | 'inactive' | 'draft',
    origin: 'system',
    year: q.ano_enem ? parseInt(q.ano_enem, 10) : (q.created_at ? parseInt(String(q.created_at).substring(0, 4), 10) : null),
    source: q.fonte || null,
    metadata: {},
    referenceId: q.id || q.referenceId || q.identificador || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  // ── Import log tracking ────────────────────────────────────
  let importLogId: string | null = null;

  try {
    // ══════════════════════════════════════════════════════════
    // AUTH GUARD
    // ══════════════════════════════════════════════════════════
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para importar questões.' },
        { status: 401 },
      );
    }

    const organizationId =
      user.user_metadata?.organization_id ||
      user.app_metadata?.organization_id;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada na sessão do usuário.' },
        { status: 403 },
      );
    }

    const userId = user.id;
    const reqBody = await req.json();
    const { questions: rawQuestions, batchId, fileName } = reqBody;

    if (!rawQuestions || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão válida recebida.' }, { status: 400 });
    }

    // ══════════════════════════════════════════════════════════
    // CREATE AUDIT LOG ENTRY (status = 'processing')
    // ══════════════════════════════════════════════════════════
    const { data: logEntry } = await supabaseAdmin
      .from('import_logs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        total_received: rawQuestions.length,
        batch_id: batchId || null,
        file_name: fileName || null,
        status: 'processing',
      })
      .select('id')
      .single();

    importLogId = logEntry?.id || null;

    // ══════════════════════════════════════════════════════════
    // LOAD LOOKUP DATA
    // ══════════════════════════════════════════════════════════
    const [{ data: dbDisciplines }, { data: dbSubjects }, { data: dbSkills }] = await Promise.all([
      supabaseAdmin.from('disciplines').select('id, name').eq('organization_id', organizationId),
      supabaseAdmin.from('subjects').select('id, name').eq('organization_id', organizationId),
      supabaseAdmin.from('bncc_skills').select('id, code, description'),
    ]);

    const lookups: LookupTables = {
      discDbByName: {},
      discDbById: new Set(),
      subDbByName: {},
      subDbById: new Set(),
      skillDbByCode: {},
      skillDbById: new Set(),
      legacyMap: loadLegacyMappingDict(),
    };

    (dbDisciplines || []).forEach(d => {
      lookups.discDbByName[d.name.toLowerCase().trim()] = d.id;
      lookups.discDbById.add(d.id);
    });
    (dbSubjects || []).forEach(s => {
      lookups.subDbByName[s.name.toLowerCase().trim()] = s.id;
      lookups.subDbById.add(s.id);
    });
    (dbSkills || []).forEach((sk: any) => {
      lookups.skillDbByCode[sk.code.toLowerCase().trim()] = sk.id;
      lookups.skillDbById.add(sk.id);
    });

    // ══════════════════════════════════════════════════════════
    // PHASE 1: ADAPT + VALIDATE (Zod Pipeline)
    // ══════════════════════════════════════════════════════════
    const validatedQuestions: NormalizedQuestion[] = [];
    const skippedReasons: Record<string, number> = {};
    let skippedCount = 0;
    const hashSet = new Set<string>();
    const refIdSet = new Set<string>();
    const disciplineBreakdown: Record<string, number> = {};

    const skipQuestion = (reason: string) => {
      skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
      skippedCount++;
    };

    for (const rawQ of rawQuestions) {
      // Step 1: Detect format and adapt
      let adapted: Partial<NormalizedQuestion>;
      if (rawQ.question !== undefined) {
        adapted = adaptAthevaFormat(rawQ, lookups);
      } else if (rawQ.statement !== undefined) {
        adapted = adaptNewTemplateFormat(rawQ, lookups);
      } else {
        adapted = adaptLegacyFormat(rawQ, lookups);
      }

      // Step 2: Sanitize HTML (handle potential non-string values)
      adapted.statement = sanitizeHtml(String(adapted.statement || ''));
      adapted.comment = sanitizeHtml(String(adapted.comment || ''));
      if (adapted.alternatives) {
        adapted.alternatives.forEach(a => { a.text = sanitizeHtml(String(a.text || '')); });
      }

      // Helper to ensure UUIDs are valid or null before Zod sees them
      const toValidUuid = (id: any) => {
        if (!id || typeof id !== 'string') return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id) ? id : null;
      };

      adapted.discId = toValidUuid(adapted.discId);
      adapted.subId = toValidUuid(adapted.subId);
      adapted.skillId = toValidUuid(adapted.skillId);

      // Step 3: Classify type based on clean alternatives
      adapted.type = classifyQuestionType(adapted.alternatives || []);
      // Filter out empty alts for MC storage
      if (adapted.type === 'multiple_choice' && adapted.alternatives) {
        adapted.alternatives = adapted.alternatives.filter(a => {
          const textContent = a.text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
          return textContent.length > 0;
        });
      } else if (adapted.type === 'discursive') {
        adapted.alternatives = [];
      }

      // Step 4: Reference ID dedup
      if (adapted.referenceId) {
        const refStr = String(adapted.referenceId);
        if (refIdSet.has(refStr)) {
          skipQuestion(`ID Duplicado: ${refStr}`);
          continue;
        }
        refIdSet.add(refStr);
      }

      // Step 5: Validate with Zod
      const parseResult = NormalizedQuestionSchema.safeParse(adapted);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0]?.message || 'Erro de validação';
        skipQuestion(`Validação: ${firstError}`);
        continue;
      }
      const validated = parseResult.data;

      // Step 6: Content hash dedup (batch level)
      const importHash = generateImportHash(validated.statement, validated.answerKey, validated.comment);
      if (hashSet.has(importHash)) {
        skipQuestion('Duplicata no lote (Conteúdo idêntico)');
        continue;
      }
      hashSet.add(importHash);

      // Track discipline breakdown
      let discName = 'Sem disciplina';
      if (validated.discId) {
        const matchedDisc = (dbDisciplines || []).find(d => d.id === validated.discId);
        if (matchedDisc) discName = matchedDisc.name;
      }
      disciplineBreakdown[discName] = (disciplineBreakdown[discName] || 0) + 1;

      validatedQuestions.push(validated);
    }

    // ══════════════════════════════════════════════════════════
    // PHASE 2: TRANSACTION BATCHING (Resilient Insert)
    // ══════════════════════════════════════════════════════════
    const BATCH_SIZE = 500;
    let totalInserted = 0;
    let totalDbFailed = 0;
    const dbErrors: { batch: number; error: string; count: number }[] = [];

    for (let batchNum = 0; batchNum < validatedQuestions.length; batchNum += BATCH_SIZE) {
      const batch = validatedQuestions.slice(batchNum, batchNum + BATCH_SIZE);
      const batchIndex = Math.floor(batchNum / BATCH_SIZE) + 1;

      // Build DB payloads for this batch
      const questionsPayload: any[] = [];
      const alternativesPayload: any[] = [];

      for (const q of batch) {
        const importHash = generateImportHash(q.statement, q.answerKey, q.comment);
        const newId = crypto.randomUUID();

        questionsPayload.push({
          id: newId,
          organization_id: organizationId,
          statement: q.statement,
          type: q.type,
          origin: q.origin,
          discipline_id: q.discId,
          subject_id: q.subId,
          bncc_skill_id: q.skillId,
          difficulty: q.difficulty,
          status: q.status,
          year: q.year,
          comment: q.comment,
          source: q.source,
          answer_key: q.type === 'multiple_choice' ? q.answerKey : q.comment,
          created_by: userId,
          import_batch_id: batchId,
          import_hash: importHash,
          metadata: Object.keys(q.metadata).length > 0 ? q.metadata : {},
        });

        if (q.type === 'multiple_choice') {
          for (const alt of q.alternatives) {
            alternativesPayload.push({
              question_id: newId,
              organization_id: organizationId,
              letter: alt.letter,
              text: alt.text,
              is_correct: alt.is_correct,
            });
          }
        }
      }

      // ── DB-level dedup: check existing hashes ──────────────
      const chunkHashes = questionsPayload.map(q => q.import_hash);
      const { data: existingHashesData } = await supabaseAdmin
        .from('questions')
        .select('import_hash')
        .in('import_hash', chunkHashes)
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      const existingHashes = new Set((existingHashesData || []).map((r: any) => r.import_hash));

      const qsToInsert = questionsPayload.filter(q => {
        if (existingHashes.has(q.import_hash)) {
          skipQuestion('Duplicata no banco (Hash já existe)');
          return false;
        }
        return true;
      });

      if (qsToInsert.length === 0) continue;

      // ── INSERT with error resilience ──────────────────────
      const { data: inserted, error: qErr } = await supabaseAdmin
        .from('questions')
        .insert(qsToInsert)
        .select('id');

      if (qErr) {
        // If the whole batch fails (e.g. unique violation), try one-by-one
        console.warn(`[IMPORT] Batch ${batchIndex} failed: ${qErr.message}. Falling back to single inserts.`);
        
        let batchRecovered = 0;
        for (const singleQ of qsToInsert) {
          const { data: singleInserted, error: singleErr } = await supabaseAdmin
            .from('questions')
            .insert(singleQ)
            .select('id');
          
          if (singleErr) {
            // Error code 23505 = unique_violation — expected and safe to skip
            if (singleErr.code === '23505') {
              skipQuestion('Duplicata no banco (Unique Constraint)');
            } else {
              totalDbFailed++;
            }
            continue;
          }

          if (singleInserted?.[0]) {
            batchRecovered++;
            const singleAlts = alternativesPayload.filter(a => a.question_id === singleQ.id);
            if (singleAlts.length > 0) {
              await supabaseAdmin.from('question_alternatives').insert(singleAlts);
            }
          }
        }

        totalInserted += batchRecovered;
        if (totalDbFailed > 0) {
          dbErrors.push({ batch: batchIndex, error: qErr.message, count: qsToInsert.length - batchRecovered });
        }
        continue;
      }

      // Batch succeeded — insert alternatives
      const insertedIds = new Set((inserted || []).map(r => r.id));
      const altsToInsert = alternativesPayload.filter(alt => insertedIds.has(alt.question_id));
      if (altsToInsert.length > 0) {
        await supabaseAdmin.from('question_alternatives').insert(altsToInsert);
      }
      totalInserted += insertedIds.size;
    }

    // ══════════════════════════════════════════════════════════
    // PHASE 3: UPDATE AUDIT LOG
    // ══════════════════════════════════════════════════════════
    if (importLogId) {
      await supabaseAdmin
        .from('import_logs')
        .update({
          completed_at: new Date().toISOString(),
          total_inserted: totalInserted,
          total_skipped: skippedCount,
          total_failed: totalDbFailed,
          skip_reasons: skippedReasons,
          error_details: dbErrors.length > 0 ? dbErrors : [],
          status: totalDbFailed > 0 ? 'completed' : 'completed',
        })
        .eq('id', importLogId);
    }

    // ══════════════════════════════════════════════════════════
    // RESPONSE
    // ══════════════════════════════════════════════════════════
    return NextResponse.json({
      message: 'Importação concluída!',
      importLogId,
      processed: rawQuestions.length,
      validated: validatedQuestions.length,
      inserted: totalInserted,
      ignored: rawQuestions.length - totalInserted,
      skippedByValidation: skippedCount,
      skippedReasons,
      dbErrors: dbErrors.length > 0 ? dbErrors : undefined,
      batchId,
      disciplineBreakdown,
    });

  } catch (error: any) {
    console.error('[IMPORT_ERROR]', error);

    // Update log with failure status if we managed to create one
    if (importLogId) {
      try {
        await supabaseAdmin
          .from('import_logs')
          .update({
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_details: [{ batch: 0, error: error.message, count: 0 }],
          })
          .eq('id', importLogId);
      } catch { /* Don't let log update failure mask the real error */ }
    }

    return NextResponse.json({ error: 'Falha fatal na importação', details: error.message }, { status: 500 });
  }
}
