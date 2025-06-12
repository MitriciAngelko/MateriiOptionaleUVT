import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Set persistence based on "Remember Me" checkbox
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      // Sign in with email and password
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (error) {
      setError('Email sau parolă incorectă');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">
      {/* Partea stângă - Imaginea */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/fundal-login.jpg"
          alt="UVT Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay pentru imagine cu un gradient de albastru spre galben */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#034a76]/80 via-[#034a76]/60 to-[#e3ab23]/40" />
        {/* Gradient pentru tranziție */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#f5f5f5] to-transparent" />
      </div>

      {/* Partea dreaptă - Formularul de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <div className="relative mx-auto h-20 w-auto mb-8">
              <img
                src="/Logo-UVT-2017-02.png"
                alt="UVT Logo"
                className="mx-auto h-20 w-auto"
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#e3ab23] rounded-full"></div>
            </div>
            <h2 className="text-4xl font-bold text-[#034a76] mb-4">
              Bine ați venit!
            </h2>
            <p className="text-lg text-[#034a76]/70">
              Vă rugăm să vă autentificați pentru a continua
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-medium">Eroare de autentificare</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-[#034a76] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 rounded-md border-[#034a76]/30 shadow-sm focus:border-[#e3ab23] focus:ring-[#e3ab23] bg-white transition-colors"
                placeholder="nume.prenume@e-uvt.ro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#034a76] mb-2">
                Parolă
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 rounded-md border-[#034a76]/30 shadow-sm focus:border-[#e3ab23] focus:ring-[#e3ab23] bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#e3ab23] border-[#034a76]/30 rounded focus:ring-[#e3ab23]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#034a76]">
                  Ține-mă minte
                </label>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#034a76] to-[#e3ab23] rounded-md transform -rotate-1 opacity-70 blur-sm"></div>
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-base font-medium text-white bg-gradient-to-r from-[#034a76] to-[#034a76] hover:from-[#034a76] hover:to-[#e3ab23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e3ab23] transition-all duration-300
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se procesează...
                  </span>
                ) : (
                  'Autentificare'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;