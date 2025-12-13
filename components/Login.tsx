
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface Props {
  onCancel: () => void;
  onSuccess: (user: any) => void;
  onRegisterClick: () => void;
}

const Login: React.FC<Props> = ({ onCancel, onSuccess, onRegisterClick }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Buscar perfil adicional se necessário
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        onSuccess({ ...data.user, name: profile?.name || data.user.email });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-equus-navy flex items-center justify-center p-4 relative overflow-hidden animate-fade-in">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" />
        </div>

        <div className="bg-white w-full max-w-md rounded-sm shadow-2xl relative z-10 overflow-hidden flex flex-col border-t-4 border-equus-gold">
            <div className="p-8 pb-6 text-center border-b border-gray-100">
                <div className="w-12 h-12 bg-equus-navy text-equus-gold rounded flex items-center justify-center mx-auto mb-4 font-serif font-bold text-xl border border-equus-gold">H</div>
                <h2 className="text-2xl font-serif font-bold text-equus-navy">Bem-vindo de volta</h2>
                <p className="text-sm text-gray-500 mt-1">Acesse sua conta para participar dos leilões</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center font-bold">
                        {error === 'Invalid login credentials' ? 'Email ou senha incorretos' : error}
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded focus:border-equus-gold outline-none transition-colors bg-gray-50 focus:bg-white"
                        placeholder="seu@email.com"
                        required
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Senha</label>
                        <a href="#" className="text-xs text-equus-gold hover:underline">Esqueceu a senha?</a>
                    </div>
                    <input 
                        type="password" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded focus:border-equus-gold outline-none transition-colors bg-gray-50 focus:bg-white"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-equus-navy text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-equus-gold hover:text-equus-navy transition-all disabled:opacity-70 shadow-lg"
                >
                    {loading ? 'Autenticando...' : 'Entrar'}
                </button>
            </form>

            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                <p className="text-sm text-gray-600">
                    Ainda não tem uma conta?{' '}
                    <button onClick={onRegisterClick} className="text-equus-navy font-bold hover:underline uppercase text-xs tracking-wider ml-1">
                        Cadastre-se
                    </button>
                </p>
            </div>
            
            <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" title="Fechar">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    </div>
  );
};

export default Login;
