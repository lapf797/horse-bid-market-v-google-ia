
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
    dob: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const handleMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cpf') {
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    }
    if (name === 'phone') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
    }
    if (name === 'cep') {
      value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepSearch = async () => {
    if (formData.cep.length < 9) return;
    setLoading(true);
    try {
        const response = await fetch(`https://viacep.com.br/ws/${formData.cep.replace('-', '')}/json/`);
        const data = await response.json();
        if (!data.erro) {
            setFormData(prev => ({ ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
        }
    } catch (e) { console.error("Erro CEP", e); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.terms) return;
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured) {
        setTimeout(() => {
            setSuccess(true);
            setLoading(false);
        }, 1500);
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    name: formData.name,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    role: 'USER'
                }]);

            if (profileError) console.error("Error creating profile:", profileError);
            setSuccess(true);
        }
    } catch (err: any) {
        setError(err.message || "Erro ao criar conta.");
    } finally {
        setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="min-h-[600px] flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
              <div className="bg-white p-12 rounded-lg shadow-2xl text-center max-w-md w-full border-t-8 border-emerald-500">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                      <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-equus-navy mb-4 uppercase tracking-tighter">Conta Criada!</h2>
                  <p className="text-gray-600 mb-10 leading-relaxed">
                      Seu registro foi processado. Você já pode participar dos leilões e gerenciar seus lances com segurança.
                  </p>
                  <button onClick={onSuccess} className="w-full bg-equus-navy text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-equus-gold transition-all shadow-lg">
                      Acessar Plataforma
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full bg-white rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px] border border-gray-200">
        <div className="hidden md:flex md:w-5/12 bg-equus-navy relative p-16 flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <img src="https://images.unsplash.com/photo-1534008277239-66175e1136b9?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10">
                <h2 className="text-equus-gold font-serif text-4xl font-bold mb-4 tracking-tighter">HORSE BID MARKET</h2>
                <p className="text-gray-400 text-xs tracking-[0.5em] uppercase font-bold">Tecnologia & Tradição</p>
            </div>
            <div className="relative z-10 space-y-8 text-white">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-equus-gold flex items-center justify-center text-equus-navy font-bold text-xs">01</div>
                  <p className="text-sm font-light">Cadastro verificado com CPF/CNPJ.</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-equus-gold flex items-center justify-center text-equus-navy font-bold text-xs">02</div>
                  <p className="text-sm font-light">Acesso instantâneo a lances em tempo real.</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-equus-gold flex items-center justify-center text-equus-navy font-bold text-xs">03</div>
                  <p className="text-sm font-light">Contratos de compra automatizados via e-mail.</p>
               </div>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">© 2025 Horse Bid Market Security</p>
            </div>
        </div>

        <div className="w-full md:w-7/12 p-12 md:p-16 flex flex-col relative bg-white">
            {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded text-sm font-bold border-l-4 border-red-500 shadow-sm animate-shake">
                    {error}
                </div>
            )}

            <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-serif font-bold text-equus-navy tracking-tight">Novo Registro</h2>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Passo {step} de 4</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 mb-8 rounded-full overflow-hidden">
                    <div className="h-full bg-equus-gold transition-all duration-700 ease-in-out shadow-[0_0_10px_#C5A059]" style={{ width: `${step * 25}%` }}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-equus-navy uppercase tracking-tighter">Identificação de Acesso</h3>
                        <div className="grid gap-6">
                            <div className="group">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 group-focus-within:text-equus-gold transition-colors">Nome Completo</label>
                                <input type="text" name="name" value={formData.name} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all placeholder-gray-300" placeholder="Nome impresso no documento" />
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 group-focus-within:text-equus-gold transition-colors">E-mail Corporativo ou Pessoal</label>
                                <input type="email" name="email" value={formData.email} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all placeholder-gray-300" placeholder="seu@email.com" />
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 group-focus-within:text-equus-gold transition-colors">Celular (WhatsApp)</label>
                                <input type="tel" name="phone" maxLength={15} value={formData.phone} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all placeholder-gray-300 font-mono" placeholder="(00) 00000-0000" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-equus-navy uppercase tracking-tighter">Validação de Crédito</h3>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Documento de Identificação (CPF)</label>
                                <input type="text" name="cpf" maxLength={14} value={formData.cpf} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all font-mono text-lg tracking-widest" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Nascimento</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-equus-navy uppercase tracking-tighter">Endereço de Faturamento</h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">CEP Postal</label>
                                <input type="text" name="cep" maxLength={9} value={formData.cep} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all font-mono" placeholder="00000-000" />
                            </div>
                            <button onClick={handleCepSearch} disabled={loading || formData.cep.length < 9} className="h-[58px] px-8 bg-equus-navy text-white rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-black disabled:opacity-50 transition-colors">
                                Validar
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Logradouro</label>
                                <input type="text" name="street" value={formData.street} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-100 text-gray-500" readOnly />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Nº</label>
                                <input type="text" name="number" value={formData.number} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white outline-none" placeholder="00" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-equus-navy uppercase tracking-tighter">Proteção de Dados</h3>
                        <div className="grid gap-6">
                             <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Crie uma Senha Forte</label>
                                <input type="password" name="password" value={formData.password} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" />
                            </div>
                             <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Confirmar Senha</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleMask} className={`w-full p-4 border rounded-sm bg-gray-50 focus:bg-white outline-none transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-equus-gold'}`} />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-100">
                             <label className="flex items-start gap-4 p-5 bg-gray-50 rounded-sm cursor-pointer hover:bg-gray-100 transition-colors group">
                                <input type="checkbox" checked={formData.terms} onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.checked }))} className="mt-1 w-6 h-6 accent-equus-navy" />
                                <span className="text-xs text-gray-500 leading-relaxed font-light">Declaro que as informações prestadas são verdadeiras e que aceito os <a href="#" className="text-equus-navy font-bold underline decoration-equus-gold">Termos de Compra e Venda</a> do Horse Bid Market.</span>
                             </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                {step === 1 ? (
                    <button onClick={onCancel} className="text-gray-400 hover:text-red-500 font-bold uppercase text-[10px] tracking-widest transition-colors">Desistir</button>
                ) : (
                    <button onClick={() => setStep(step - 1)} className="text-gray-500 hover:text-equus-navy font-bold uppercase text-[10px] tracking-widest transition-colors">Voltar</button>
                )}
                {step < 4 ? (
                     <button onClick={() => setStep(step + 1)} className="bg-equus-navy text-white px-10 py-5 rounded-sm shadow-xl hover:bg-black transition-all font-bold uppercase text-[10px] tracking-widest">Avançar</button>
                ) : (
                     <button onClick={handleSubmit} disabled={!formData.terms || loading} className="bg-equus-gold text-equus-navy px-10 py-5 rounded-sm shadow-xl hover:bg-white border border-equus-gold transition-all font-bold uppercase text-[10px] tracking-widest disabled:opacity-50">
                        {loading ? 'Sincronizando...' : 'Concluir Cadastro'}
                     </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
