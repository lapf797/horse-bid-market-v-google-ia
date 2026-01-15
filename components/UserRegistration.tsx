
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

const UserRegistration: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    terms: true
  });

  const handleMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cpf') {
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    }
    if (name === 'phone') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Simulação de processamento tecnológico "AI Validation"
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!isSupabaseConfigured) {
        setSuccess(true);
        setLoading(false);
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
            await supabase.from('profiles').insert([{
                id: authData.user.id,
                name: formData.name,
                cpf: formData.cpf,
                phone: formData.phone,
                role: 'USER'
            }]);
            setSuccess(true);
        }
    } catch (err: any) {
        setError(err.message || "Erro ao processar registro.");
    } finally {
        setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="min-h-[600px] flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white p-12 rounded-sm shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] text-center max-w-md w-full border-t-8 border-equus-gold">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-equus-navy mb-4 uppercase tracking-tighter italic">Bem-vindo à Elite</h2>
                  <p className="text-sm text-gray-500 mb-10 leading-relaxed">
                      Seu perfil foi validado. Você agora está apto a participar dos leilões oficiais do Horse Bid Market.
                  </p>
                  <button onClick={onSuccess} className="w-full bg-equus-navy text-white py-5 rounded-sm font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-equus-gold hover:text-equus-navy transition-all">
                      Acessar Painel de Lances
                  </button>
              </div>
          </div>
      );
  }

  const inputClass = "w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:bg-white focus:border-equus-gold focus:ring-1 focus:ring-equus-gold outline-none transition-all text-sm font-medium text-equus-navy placeholder:text-gray-300 shadow-sm";
  const labelClass = "text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 block";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50/50">
      <div className="max-w-xl w-full bg-white rounded-sm shadow-[0_30px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden">
        
        {/* Header Tecnológico */}
        <div className="bg-equus-navy p-10 text-white text-center border-b-4 border-equus-gold">
            <div className="w-10 h-10 border-2 border-equus-gold rounded flex items-center justify-center font-serif text-lg text-equus-gold mx-auto mb-4">H</div>
            <h2 className="text-2xl font-serif font-bold italic uppercase tracking-tighter">Registro de Comprador</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] mt-2">Validação em Tempo Real</p>
        </div>

        <div className="p-10 md:p-14">
            {error && (
                <div className="mb-8 bg-red-50 text-red-600 p-4 rounded-sm text-[10px] font-bold border-l-4 border-red-500 uppercase tracking-widest animate-shake">
                    {error}
                </div>
            )}

            <div className="space-y-8">
                {step === 1 ? (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col">
                            <label className={labelClass}>Nome Completo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleMask} className={inputClass} placeholder="Ex: Rodrigo Silva" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>WhatsApp</label>
                                <input type="tel" name="phone" maxLength={15} value={formData.phone} onChange={handleMask} className={inputClass} placeholder="(00) 00000-0000" />
                            </div>
                            <div>
                                <label className={labelClass}>E-mail</label>
                                <input type="email" name="email" value={formData.email} onChange={handleMask} className={inputClass} placeholder="seu@email.com" />
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep(2)} 
                            disabled={!formData.name || !formData.email || !formData.phone}
                            className="w-full bg-equus-navy text-white py-5 rounded-sm font-bold uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-black transition-all mt-4 disabled:opacity-30"
                        >
                            Próximo Passo
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col">
                            <label className={labelClass}>CPF (Para validação de lances)</label>
                            <input type="text" name="cpf" maxLength={14} value={formData.cpf} onChange={handleMask} className={`${inputClass} !text-lg font-mono tracking-widest`} placeholder="000.000.000-00" />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Crie sua Senha de Acesso</label>
                            <input type="password" name="password" value={formData.password} onChange={handleMask} className={inputClass} placeholder="••••••••" />
                        </div>
                        
                        <div className="pt-4">
                            <button 
                                onClick={handleSubmit} 
                                disabled={loading || !formData.cpf || !formData.password}
                                className="w-full bg-equus-gold text-equus-navy py-5 rounded-sm font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-white border border-equus-gold transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-equus-navy border-t-transparent rounded-full animate-spin"></div>
                                        Sincronizando Perfil...
                                    </>
                                ) : 'Finalizar e Liberar Lances'}
                            </button>
                        </div>
                        <button onClick={() => setStep(1)} className="w-full text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Voltar e editar dados</button>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-gray-50 p-6 flex items-center justify-center gap-6 border-t border-gray-100">
            <div className="flex items-center gap-2 grayscale opacity-40">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                <span className="text-[8px] font-bold uppercase tracking-widest">SSL Secure Data</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <button onClick={onCancel} className="text-[8px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Cancelar Registro</button>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
