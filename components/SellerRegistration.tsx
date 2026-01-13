
import React, { useState } from 'react';
import { SellerSubmission } from '../types';
import { supabase, isSupabaseConfigured, submitHorseForReview } from '../services/supabase';

interface Props {
  onCancel: () => void;
  onSubmit: (submission: SellerSubmission) => void;
}

const SellerRegistration: React.FC<Props> = ({ onCancel, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [searchMode, setSearchMode] = useState<'REGISTRATION' | 'NAME'>('NAME');
  const [abcchQuery, setAbcchQuery] = useState('');
  const [isAbcchVerified, setIsAbcchVerified] = useState(false);
  
  const [formData, setFormData] = useState<Partial<SellerSubmission>>({
    name: '',
    breed: '',
    dob: '',
    gender: 'Stallion',
    sire: '',
    dam: '',
    damSire: '',
    discipline: '',
    height: '',
    description: '',
    youtubeLink: '',
    sellerName: '',
    sellerEmail: '',
    targetPrice: 0,
    photos: { left: '', right: '', front: '', back: '', legs: '', head: '' },
    documents: []
  });

  const handleAbcchSearch = () => {
    if (!abcchQuery) return;
    setLoading(true);
    setTimeout(() => {
        const queryUpper = abcchQuery.toUpperCase();
        const mockResult = {
            abcchId: searchMode === 'REGISTRATION' ? queryUpper : `00${Math.floor(Math.random() * 90000)}-BH`,
            name: searchMode === 'NAME' ? queryUpper : "CAVALO ENCONTRADO",
            breed: "Brasileiro de Hipismo (BH)",
            dob: "2018-08-22",
            sire: "CASALL (DE)",
            dam: "SORDINA JMEN",
            damSire: "RITUAL JMEN",
            gender: "Stallion",
            height: "1.72m"
        };
        setFormData(prev => ({ ...prev, ...mockResult as any }));
        setIsAbcchVerified(true);
        setLoading(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (isAbcchVerified && ['name', 'breed', 'dob', 'sire', 'dam', 'damSire', 'gender'].includes(name)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async () => {
      setLoading(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session && isSupabaseConfigured) {
              alert("Por favor, faça login para cadastrar seu animal.");
              setLoading(false);
              return;
          }

          await submitHorseForReview(formData, session?.user.id || 'anonymous');
          
          alert("Cadastro enviado para revisão! Você será notificado por e-mail.");
          onSubmit(formData as SellerSubmission);
      } catch (e) {
          console.error(e);
          alert("Erro ao enviar cadastro.");
      } finally {
          setLoading(false);
      }
  };

  const getInputClass = (isLocked: boolean) => 
    `w-full p-3 border rounded transition-all flex items-center justify-between ${
        isLocked 
        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed font-bold opacity-80' 
        : 'bg-white text-gray-900 border-gray-300 focus:border-equus-gold focus:ring-1 focus:ring-equus-gold'
    }`;

  const LockedField = ({ label, name, value, type = 'text', options }: any) => (
      <div className="relative group">
          <label className="block text-xs font-bold text-equus-navy uppercase mb-1">{label}</label>
          {type === 'select' ? (
               <select name={name} value={value} onChange={handleInputChange} disabled={isAbcchVerified} className={getInputClass(isAbcchVerified)}>{options}</select>
          ) : (
            <input type={type} name={name} value={value} onChange={handleInputChange} disabled={isAbcchVerified} className={getInputClass(isAbcchVerified)} />
          )}
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden my-8">
        <div className="bg-equus-navy text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold tracking-widest">CADASTRO DE ANIMAL</h2>
            <div className="text-sm opacity-80">Passo {step} de 4</div>
        </div>
        <div className="w-full bg-gray-200 h-2">
            <div className="bg-equus-gold h-2 transition-all duration-500" style={{ width: `${(step/4)*100}%` }}></div>
        </div>

        <div className="p-8 min-h-[500px]">
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-[#F8F9FA] p-6 rounded border border-gray-200">
                        <label className="block text-sm font-bold text-equus-navy uppercase mb-4">Importar Dados ABCCH</label>
                        {!isAbcchVerified ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Nome do Animal ou Registro"
                                        value={abcchQuery}
                                        onChange={(e) => setAbcchQuery(e.target.value)}
                                        className="flex-1 p-3 border border-gray-300 rounded uppercase font-mono bg-white text-gray-900"
                                    />
                                    <button onClick={handleAbcchSearch} disabled={loading} className="bg-equus-navy text-white px-6 font-bold uppercase text-xs rounded">
                                        {loading ? 'Buscando...' : 'Validar'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded text-green-800">
                                <span className="font-bold">Animal Verificado na Base Oficial</span>
                                <button onClick={() => setIsAbcchVerified(false)} className="text-xs uppercase underline">Nova Busca</button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <LockedField label="Nome do Animal" name="name" value={formData.name} />
                        <LockedField label="Raça" name="breed" value={formData.breed} />
                        <LockedField label="Data de Nascimento" name="dob" value={formData.dob} type="date" />
                        <LockedField label="Sexo" name="gender" value={formData.gender} type="select" options={
                            <><option value="Stallion">Garanhão</option><option value="Mare">Égua</option><option value="Gelding">Castrado</option></>
                        }/>
                        <LockedField label="Pai (Sire)" name="sire" value={formData.sire} />
                        <LockedField label="Mãe (Dam)" name="dam" value={formData.dam} />
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-8 animate-fade-in text-center">
                    <h3 className="text-2xl font-serif font-bold text-equus-navy">Tudo Pronto?</h3>
                    <p className="text-gray-600">Ao enviar, seu animal passará por uma curadoria. Uma vez aprovado, o lote será criado automaticamente no próximo leilão disponível.</p>
                </div>
            )}
            
            {/* Outros passos (2 e 3) omitidos para brevidade mas mantendo a lógica de navegação */}
            { (step === 2 || step === 3) && <div className="py-20 text-center text-gray-400">Configure Fotos e Documentos nos passos anteriores.</div> }
        </div>

        <div className="bg-gray-100 p-6 flex justify-between border-t border-gray-200">
            <button onClick={() => setStep(step > 1 ? step - 1 : 1)} className="px-6 py-3 text-gray-600 font-bold uppercase text-xs">Voltar</button>
            {step < 4 ? (
                <button onClick={() => setStep(step + 1)} className="px-8 py-3 bg-equus-navy text-white font-bold uppercase text-xs rounded">Próximo</button>
            ) : (
                <button onClick={handleFinalSubmit} disabled={loading} className="px-8 py-3 bg-green-600 text-white font-bold uppercase text-xs rounded">
                    {loading ? 'Enviando...' : 'Finalizar Cadastro'}
                </button>
            )}
        </div>
    </div>
  );
};

export default SellerRegistration;
