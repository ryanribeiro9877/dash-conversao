import { useState } from 'react';
import { supabase } from './lib/supabase';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';

const BRAND = {
  purple: '#380e74',
  purpleLight: '#f3eaff',
  purpleMid: '#b88aed',
  orange: '#ff791a',
  orangeLight: '#fff4eb',
  orangeDark: '#e06000',
  white: '#ffffff',
};

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('E-mail ou senha incorretos.');
        } else {
          setError(error.message);
        }
        return;
      }

      onLogin();
    } catch {
      setError('Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${BRAND.purple} 0%, #1a0538 50%, ${BRAND.purple} 100%)`,
      }}
    >
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Card de Login */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: BRAND.purple, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 20px rgba(56, 14, 116, 0.4)' }}>
          <div className="text-center mb-6">
            <img
              src={supabase.storage.from('img').getPublicUrl('logo.webp').data.publicUrl}
              alt="Logo"
              className="h-16 w-auto object-contain mx-auto mb-3"
            />
            <h2 className="text-xl font-bold text-white">Dashboard de Conversão</h2>
            <p className="text-sm mt-1" style={{ color: BRAND.purpleMid }}>
              Legal é Viver - Gestão Inteligente de Leads
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">E-mail</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border-0 rounded-lg focus:outline-none transition-all duration-300 text-sm"
                  style={{
                    backgroundColor: BRAND.white,
                    boxShadow: email ? `0 0 0 2px ${BRAND.purple}44` : undefined,
                  }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Senha</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 border-0 rounded-lg focus:outline-none transition-all duration-300 text-sm"
                  style={{
                    backgroundColor: BRAND.white,
                    boxShadow: password ? `0 0 0 2px ${BRAND.purple}44` : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="text-sm rounded-lg px-4 py-3 animate-fade-in-up" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND.orange }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = BRAND.orangeDark)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = BRAND.orange)}
            >
              {loading ? (
                <>
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                  ></div>
                  Entrando...
                </>
              ) : (
                <>
                  <FiLogIn />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: BRAND.purpleMid }}>
          Dashboard de Conversão - Legal é Viver &copy; 2026
        </p>
      </div>
    </div>
  );
}
