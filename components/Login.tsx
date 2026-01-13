
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

    // Specific logic for manual Admin access as requested
    if (formData.email === 'admin' && formData.password === '123456') {
      onSuccess({ id: 'admin-1', name: 'Administrador Principal', type: 'ADMIN', role: 'ADMIN' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        onSuccess({ ...data.user, name: data.user.email, type: 'USER', role: 'USER' });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-equus-navy flex items-center justify-center p-4 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 z-0 opacity-20">
             <img src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop" className="w-full h-full object-cover" />
        </div>

        <div className="bg-white w-full max-w-md rounded-sm shadow-2xl relative z-10 overflow-hidden flex flex-col border-t-4 border-equus-gold">
            <div className="p-8 pb-6 text-center border-b border-gray-100">
                <div className="w-12 h-12 bg-equus-navy text-equus-gold rounded flex items-center justify-center mx-auto mb-4 font-serif font-bold text-xl border border-equus-gold">H</div>
                <h2 className="text-2xl font-serif font-bold text-equus-navy">Acesso Restrito</h2>
                <p className="text-sm text-gray-500 mt-1">Entre para operar a plataforma</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center font-bold">{error}</div>
                )}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuário ou E-mail</label>
                    <input 
                        type="text" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded focus:border-equus-gold outline-none bg-gray-50"
                        placeholder="Ex: admin"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                    <input 
                        type="password" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded focus:border-equus-gold outline-none bg-gray-50"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-equus-navy text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-equus-gold hover:text-equus-navy transition-all shadow-lg"
                >
                    {loading ? 'Validando...' : 'Entrar'}
                </button>
            </form>

            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                <p className="text-sm text-gray-600">Não possui conta? <button onClick={onRegisterClick} className="text-equus-navy font-bold uppercase text-xs">Cadastre-se</button></p>
            </div>
            
            <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400">&times;</button>
        </div>
    </div>
  );
};

export default Login;
