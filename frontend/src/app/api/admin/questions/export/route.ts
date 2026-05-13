import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Tab,
  TabStopPosition,
  TabStopType,
  ImageRun,
  PageNumber,
  Footer,
  Header,
} from 'docx';

// ─── Auth Helper ──────────────────────────────────────────────
async function getAuthenticatedUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// ─── Supabase Admin (bypasses RLS) ───────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// ─── Helpers ──────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function questionDisplayCode(id: string): string {
  return `Q-${id.slice(0, 8).toUpperCase()}`;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

// ─── Fetch image as buffer (graceful) ─────────────────────────
async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; width: number; height: number; type: "png" | "jpg" | "gif" | "bmp" } | null> {
  if (url.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';
    url = `${baseUrl}${url}`;
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    
    const contentType = res.headers.get('content-type') || '';
    let docxType: "png" | "jpg" | "gif" | "bmp" = "png";
    if (contentType.includes('jpeg') || contentType.includes('jpg') || url.toLowerCase().includes('.jpg')) {
      docxType = 'jpg';
    } else if (contentType.includes('gif') || url.toLowerCase().includes('.gif')) {
      docxType = 'gif';
    } else if (contentType.includes('bmp') || url.toLowerCase().includes('.bmp')) {
      docxType = 'bmp';
    }
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // We omit width/height and let docx detect natively (or use fixed default 400x300)
    return { buffer, width: 400, height: 300, type: docxType };
  } catch (err) {
    console.error('[export] Erro buscando imagem:', err);
    return null;
  }
}

// ─── Build Word Document ──────────────────────────────────────
async function buildQuestionDocument(question: any) {
  const code = questionDisplayCode(question.id);
  const plainStatement = stripHtml(question.statement);
  const plainComment = question.comment ? stripHtml(question.comment) : null;
  const answerKey = question.answer_key
    || question.question_alternatives?.find((a: any) => a.is_correct)?.letter
    || '—';
  const diffLabel = question.difficulty ? (DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty) : '—';
  const disciplineName = question.disciplines?.name ?? '—';
  const subjectName = question.subjects?.name ?? '—';
  const sourceName = question.source ?? '—';
  const yearStr = question.year ? String(question.year) : '—';
  const bnccCode = question.bncc_skills?.code ?? '—';
  const stageName = question.education_stages?.name ?? '—';
  const gradeName = question.grades?.name ?? '—';

  // ── Extract all image URLs from statement (img tags) and question.image_url ──
  const imageUrls: string[] = [];
  if (question.image_url) {
    imageUrls.push(question.image_url);
  }
  const inlineImageRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let match;
  while ((match = inlineImageRegex.exec(question.statement || '')) !== null) {
    if (!imageUrls.includes(match[1])) imageUrls.push(match[1]);
  }

  // ── Header fields (editable placeholders for teachers) ──
  const headerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Instituição: ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: '________________________________________', size: 20, font: 'Calibri', color: '999999' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Disciplina: ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: disciplineName !== '—' ? disciplineName : '____________________', size: 20, font: 'Calibri', color: disciplineName !== '—' ? '333333' : '999999' }),
        new TextRun({ text: '          Professor(a): ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: '____________________', size: 20, font: 'Calibri', color: '999999' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'Data: ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: '_____ / _____ / _________', size: 20, font: 'Calibri', color: '999999' }),
        new TextRun({ text: '          Aluno(a): ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: '________________________________________', size: 20, font: 'Calibri', color: '999999' }),
      ],
    }),
  ];

  // ── Separator line ──
  const separator = new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '7C3AED', space: 1 },
    },
    children: [],
  });

  const thinSeparator = new Paragraph({
    spacing: { before: 160, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC', space: 1 },
    },
    children: [],
  });

  // ── Question title ──
  const questionTitle = new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: `QUESTÃO  [${code}]`, bold: true, size: 26, font: 'Calibri', color: '7C3AED' }),
    ],
  });

  // ── Statement paragraphs ──
  const statementParagraphs = plainStatement.split('\n').filter(Boolean).map(
    (line: string) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: line, size: 24, font: 'Calibri' }),
        ],
      }),
  );

  // ── Statement images ──
  const imageParagraphs: Paragraph[] = [];
  for (const url of imageUrls) {
    const fetched = await fetchImageBuffer(url);
    if (fetched) {
      imageParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: fetched.buffer,
              transformation: { width: fetched.width, height: fetched.height },
              type: fetched.type,
            }),
          ],
        }),
      );
    }
  }

  if (imageUrls.length > 0 && imageParagraphs.length === 0) {
    imageParagraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({ text: '[Imagem indisponível]', italics: true, size: 20, font: 'Calibri', color: '999999' }),
        ],
      }),
    );
  }

  // ── Alternatives ──
  const alternativeParagraphs: Paragraph[] = [];
  if (question.type === 'multiple_choice' && question.question_alternatives?.length > 0) {
    alternativeParagraphs.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
    
    // We run an async fetch for all alternative images
    for (const alt of question.question_alternatives) {
      alternativeParagraphs.push(
        new Paragraph({
          spacing: { after: 100 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${alt.letter})  `, bold: true, size: 24, font: 'Calibri' }),
            new TextRun({ text: stripHtml(alt.text || ''), size: 24, font: 'Calibri' }),
          ],
        }),
      );

      if (alt.image_url) {
        const altImage = await fetchImageBuffer(alt.image_url);
        if (altImage) {
          alternativeParagraphs.push(
            new Paragraph({
              spacing: { after: 120 },
              indent: { left: 720 }, // Extra indent for alternative image
              alignment: AlignmentType.LEFT,
              children: [
                new ImageRun({
                  data: altImage.buffer,
                  transformation: { width: 250, height: 200 }, // smaller for alternatives
                  type: altImage.type,
                }),
              ],
            }),
          );
        }
      }
    }
  }

  // ── Metadata section ──
  const metadataTitle = new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({ text: 'METADADOS', bold: true, size: 20, font: 'Calibri', color: '64748B' }),
    ],
  });

  const metadataGrid = [
    `ID: ${code}`,
    `Disciplina: ${disciplineName}`,
    `Assunto: ${subjectName}`,
    `Dificuldade: ${diffLabel}`,
    `Fonte: ${sourceName}`,
    `Ano: ${yearStr}`,
    `Habilidade BNCC: ${bnccCode}`,
    `Etapa: ${stageName}`,
    `Série: ${gradeName}`,
  ];

  const metadataParagraphs = metadataGrid.map(
    (item) =>
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: item, size: 18, font: 'Calibri', color: '64748B' }),
        ],
      }),
  );

  // ── Answer key section ──
  const gabaritoTitle = new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({ text: 'GABARITO', bold: true, size: 22, font: 'Calibri', color: '059669' }),
    ],
  });

  const gabaritoAnswer = new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: 'Resposta Correta:  ', size: 24, font: 'Calibri' }),
      new TextRun({ text: answerKey, bold: true, size: 28, font: 'Calibri', color: '059669' }),
    ],
  });

  // ── Comment / Resolution ──
  const commentParagraphs: Paragraph[] = [];
  if (plainComment) {
    commentParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({ text: 'COMENTÁRIO / RESOLUÇÃO', bold: true, size: 20, font: 'Calibri', color: 'D97706' }),
        ],
      }),
    );
    const commentLines = plainComment.split('\n').filter(Boolean);
    for (const line of commentLines) {
      commentParagraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: line, size: 22, font: 'Calibri', color: '78350F' }),
          ],
        }),
      );
    }
  }

  // ── Footer ──
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // ── Assemble document ──
  const doc = new Document({
    creator: 'EduK — Plataforma Educacional',
    title: `Questão ${code}`,
    description: `Exportação da questão ${code} gerada pelo EduK`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Gerado por EduK  •  ${dateStr}  •  `, size: 16, font: 'Calibri', color: '94A3B8' }),
                  new TextRun({ text: code, size: 16, font: 'Calibri', color: '94A3B8', bold: true }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...headerParagraphs,
          separator,
          questionTitle,
          ...statementParagraphs,
          ...imageParagraphs,
          ...alternativeParagraphs,
          thinSeparator,
          metadataTitle,
          ...metadataParagraphs,
          separator,
          gabaritoTitle,
          gabaritoAnswer,
          ...commentParagraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ═══════════════════════════════════════════════════════════════
// POST /api/admin/questions/export
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // 2. Parse body
  let questionId: string;
  try {
    const body = await req.json();
    questionId = body.questionId;
    if (!questionId || typeof questionId !== 'string') {
      return NextResponse.json({ error: 'questionId é obrigatório' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  // 3. Fetch the question with all joins
  const { data: question, error: qErr } = await supabaseAdmin
    .from('questions')
    .select(`
      *,
      disciplines:discipline_id ( id, name, color_hex ),
      subjects:subject_id ( id, name ),
      education_stages:stage_id ( id, name ),
      grades:grade_id ( id, name ),
      bncc_skills:bncc_skill_id ( id, code, description ),
      question_alternatives ( id, letter, text, is_correct, image_url )
    `)
    .eq('id', questionId)
    .is('deleted_at', null)
    .single();

  if (qErr || !question) {
    return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 });
  }

  // 4. Verify organization ownership
  const orgId = user.user_metadata?.organization_id || user.app_metadata?.organization_id;
  if (orgId && question.organization_id !== orgId) {
    return NextResponse.json({ error: 'Acesso não autorizado a esta questão' }, { status: 403 });
  }

  // 5. Deduplicate and Sort alternatives by letter before building
  if (question.question_alternatives) {
    const uniqueAlts = new Map();
    for (const alt of question.question_alternatives) {
      if (!uniqueAlts.has(alt.letter)) {
        uniqueAlts.set(alt.letter, alt);
      }
    }
    question.question_alternatives = Array.from(uniqueAlts.values()).sort((a: any, b: any) => a.letter.localeCompare(b.letter));
  }

  // 6. Build .docx
  try {
    const buffer = await buildQuestionDocument(question);
    const code = questionDisplayCode(question.id);
    const filename = `questao-${code}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[export] Erro ao gerar .docx:', err);
    return NextResponse.json({ error: 'Falha ao gerar documento' }, { status: 500 });
  }
}
