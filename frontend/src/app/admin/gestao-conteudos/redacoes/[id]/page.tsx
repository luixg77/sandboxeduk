'use client';

import { useEffect, useState } from 'react';
import { EssayPromptForm } from '../components/EssayPromptForm';
import { createClient } from '@/lib/supabase/client';
import { EssayPrompt } from '@/hooks/useEssayPrompts';

export default function EditarRedacaoPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<EssayPrompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrompt = async () => {
      const supabase = createClient();
      const { data: prompt, error } = await supabase
        .from('essay_prompts')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (!error && prompt) {
        setData(prompt as EssayPrompt);
      }
      setLoading(false);
    };

    fetchPrompt();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-slate-500">Proposta não encontrada.</div>;
  }

  return <EssayPromptForm initialData={data} isEdit={true} />;
}
