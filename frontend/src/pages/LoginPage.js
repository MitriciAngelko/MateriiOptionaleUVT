import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Partea stângă - Imaginea */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/fundal-login.jpg"
          alt="UVT Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay pentru imagine */}
        <div className="absolute inset-0 bg-[#034a76] bg-opacity-20" />
        {/* Gradient pentru tranziție */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-gray-50 to-transparent" />
      </div>

      {/* Partea dreaptă - Formularul de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <img
              src="/Logo-UVT-2017-02.png"
              alt="UVT Logo"
              className="mx-auto h-20 w-auto mb-8"
            />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bine ați venit!
            </h2>
            <p className="text-lg text-gray-600">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-[#034a76] focus:ring-[#034a76] transition-colors"
                placeholder="nume.prenume@e-uvt.ro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parolă
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-[#034a76] focus:ring-[#034a76] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-base font-medium text-white bg-[#034a76] hover:bg-[#023557] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#034a76] transition-colors
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
