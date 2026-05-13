'use client';

import { useEffect, useState } from 'react';
import { SimulatorForm } from '../components/SimulatorForm';
import { createClient } from '@/lib/supabase/client';
import { Simulator } from '@/hooks/useSimulators';

export default function EditarSimuladorPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Simulator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimulator = async () => {
      const supabase = createClient();
      const { data: simulator, error } = await supabase
        .from('simulators')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!error && simulator) {
        setData(simulator as Simulator);
      }
      setLoading(false);
    };

    fetchSimulator();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-slate-500">Simulador não encontrado.</div>;
  }

  return <SimulatorForm initialData={data} isEdit={true} />;
}
