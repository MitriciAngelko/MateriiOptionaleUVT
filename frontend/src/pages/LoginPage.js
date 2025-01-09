import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Adresa de email este invalidă.');
          break;
        case 'auth/user-disabled':
          setError('Acest cont a fost dezactivat.');
          break;
        case 'auth/user-not-found':
          setError('Nu există niciun cont cu acest email.');
          break;
        case 'auth/wrong-password':
          setError('Parolă incorectă.');
          break;
        default:
          setError('A apărut o eroare la autentificare. Vă rugăm încercați din nou.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Autentificare</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parolă
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 text-white rounded-lg transition-colors
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'}`}
          >
            {loading ? 'Se autentifică...' : 'Autentificare'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Nu ai cont?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-500 hover:text-blue-700 font-semibold"
          >
            Înregistrează-te aici
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
