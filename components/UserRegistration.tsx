
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

    // Se não estiver configurado, simulamos um sucesso para permitir testes de interface
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
              <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full border-t-4 border-equus-gold">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-equus-navy mb-2">Cadastro Realizado!</h2>
                  <p className="text-gray-600 mb-8">
                      {!isSupabaseConfigured 
                        ? "Modo Demonstração: Seu cadastro foi simulado com sucesso."
                        : "Sua conta foi criada com sucesso. Verifique seu email para confirmar ou acesse agora."}
                  </p>
                  <button onClick={onSuccess} className="w-full bg-equus-navy text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-equus-gold transition-colors">
                      Acessar Plataforma
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {!isSupabaseConfigured && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded-full text-xs font-bold uppercase z-50">
              Modo Demonstração: Cadastro Simulado
          </div>
      )}
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        <div className="hidden md:flex md:w-5/12 bg-equus-navy relative p-12 flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <img src="https://images.unsplash.com/photo-1534008277239-66175e1136b9?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10">
                <h2 className="text-equus-gold font-serif text-3xl font-bold mb-2">HORSE BID MARKET</h2>
                <p className="text-gray-400 text-sm tracking-widest uppercase">Tecnologia & Tradição</p>
            </div>
            <div className="relative z-10 space-y-8 text-white">
               <p>Junte-se à maior comunidade de elite equestre e participe de leilões europeus automatizados.</p>
            </div>
            <div className="relative z-10">
                <p className="text-xs text-gray-500">© 2025 Horse Bid Market Inc.</p>
            </div>
        </div>

        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col relative">
            {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm font-bold border border-red-200">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-equus-navy">Criar Conta</h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Passo {step} de 4</span>
                </div>
                <div className="w-full bg-gray-100 h-1 mb-8 rounded-full overflow-hidden">
                    <div className="h-full bg-equus-gold transition-all duration-500 ease-out" style={{ width: `${step * 25}%` }}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800">Vamos começar pelos seus dados de acesso</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                <input type="text" name="name" value={formData.name} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" placeholder="Como consta no seu documento" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Principal</label>
                                <input type="email" name="email" value={formData.email} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Celular (WhatsApp)</label>
                                <input type="tel" name="phone" maxLength={15} value={formData.phone} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" placeholder="(00) 00000-0000" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800">Dados Pessoais para Validação</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
                                <input type="text" name="cpf" maxLength={14} value={formData.cpf} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all font-mono tracking-wider" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data de Nascimento</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800">Endereço Residencial</h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CEP</label>
                                <input type="text" name="cep" maxLength={9} value={formData.cep} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" placeholder="00000-000" />
                            </div>
                            <button onClick={handleCepSearch} disabled={loading || formData.cep.length < 9} className="h-[58px] px-6 bg-equus-navy text-white rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-gray-800 disabled:opacity-50">
                                {loading ? 'Buscando...' : 'Buscar CEP'}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rua</label>
                                <input type="text" name="street" value={formData.street} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número</label>
                                <input type="text" name="number" value={formData.number} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800">Segurança da Conta</h3>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                                <input type="password" name="password" value={formData.password} onChange={handleMask} className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-equus-gold outline-none transition-all" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Senha</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleMask} className={`w-full p-4 border rounded-lg bg-gray-50 focus:bg-white outline-none transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200 focus:border-equus-gold'}`} />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                             <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input type="checkbox" checked={formData.terms} onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.checked }))} className="mt-1 w-5 h-5 accent-equus-navy" />
                                <span className="text-sm text-gray-600">Li e concordo com os <a href="#" className="text-equus-navy font-bold underline">Termos de Uso</a> e <a href="#" className="text-equus-navy font-bold underline">Política de Privacidade</a>.</span>
                             </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                {step === 1 ? (
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 font-bold uppercase text-xs tracking-wider">Cancelar</button>
                ) : (
                    <button onClick={() => setStep(step - 1)} className="text-gray-500 hover:text-equus-navy font-bold uppercase text-xs tracking-wider">Voltar</button>
                )}
                {step < 4 ? (
                     <button onClick={() => setStep(step + 1)} className="bg-equus-navy text-white px-8 py-4 rounded shadow-lg hover:bg-gray-800 transition-all font-bold uppercase text-xs tracking-widest">Próximo Passo</button>
                ) : (
                     <button onClick={handleSubmit} disabled={!formData.terms || loading} className="bg-equus-gold text-equus-navy px-8 py-4 rounded shadow-lg hover:bg-white transition-all font-bold uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Criando Conta...' : 'Finalizar Cadastro'}
                     </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
