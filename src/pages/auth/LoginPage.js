import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import ThemeToggle from '../../components/ThemeToggle';

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
    <div className="flex h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden transition-all duration-500">
      {/* Theme Toggle - Enhanced positioning */}
      <div className="fixed top-6 right-6 z-50">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/20 dark:border-gray-700/50">
          <ThemeToggle />
        </div>
      </div>
      
      {/* Left Side - Enhanced Image Section */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="fundal-login.jpg"
          alt="UVT Login"
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-700 hover:scale-100"
        />
        {/* Enhanced overlay with better gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#024A76]/85 via-[#024A76]/70 to-[#E3AB23]/50" />
        {/* Animated particles overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#E3AB23] rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#E3AB23] rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        {/* Smooth transition gradient */}
        <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-white dark:from-gray-800 via-white/50 dark:via-gray-800/50 to-transparent transition-colors duration-500" />
        
        {/* Welcome text overlay */}
        <div className="absolute bottom-12 left-12 text-white max-w-md">
          <h3 className="text-2xl font-bold mb-3 drop-shadow-lg">Universitatea de Vest din Timișoara</h3>
          <p className="text-white/90 drop-shadow-md leading-relaxed">Platformă modernă pentru gestionarea materiilor opționale și a procesului academic.</p>
        </div>
      </div>

      {/* Right Side - Enhanced Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#E3AB23] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-[#024A76] rounded-full blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <div className="relative mx-auto h-24 w-auto mb-8 group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#024A76]/10 to-[#E3AB23]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50">
                <img
                  src="/Logo-UVT-2017-02.png"
                  alt="UVT Logo"
                  className="mx-auto h-16 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gradient-to-r from-[#024A76] via-[#E3AB23] to-[#3471B8] rounded-full shadow-lg animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#024A76] via-[#3471B8] to-[#E3AB23] bg-clip-text text-transparent mb-4 drop-shadow-sm animate-fade-in">
                Bine ați venit!
              </h2>
              <p className="text-lg text-[#024A76]/80 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
                Vă rugăm să vă autentificați pentru a accesa platforma educațională
              </p>
            </div>
          </div>

          {/* Enhanced Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-xl shadow-lg backdrop-blur-sm animate-shake">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Eroare de autentificare</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Email Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-gray-200 mb-3 transition-colors duration-200 group-focus-within:text-[#E3AB23] dark:group-focus-within:text-yellow-accent">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span>Adresa de email</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full px-4 py-4 rounded-xl border-2 border-[#024A76]/20 dark:border-gray-600 shadow-sm focus:border-[#E3AB23] dark:focus:border-yellow-accent focus:ring-4 focus:ring-[#E3AB23]/20 dark:focus:ring-yellow-accent/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-gray-200 transition-all duration-300 hover:shadow-lg hover:border-[#024A76]/40 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"ç
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#024A76]/5 to-[#E3AB23]/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-gray-200 mb-3 transition-colors duration-200 group-focus-within:text-[#E3AB23] dark:group-focus-within:text-yellow-accent">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Parola</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full px-4 py-4 rounded-xl border-2 border-[#024A76]/20 dark:border-gray-600 shadow-sm focus:border-[#E3AB23] dark:focus:border-yellow-accent focus:ring-4 focus:ring-[#E3AB23]/20 dark:focus:ring-yellow-accent/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-gray-200 transition-all duration-300 hover:shadow-lg hover:border-[#024A76]/40 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="••••••••••••"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#024A76]/5 to-[#E3AB23]/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Remember Me Section */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center group">
                <div className="relative">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 text-[#E3AB23] border-2 border-[#024A76]/30 dark:border-gray-600 rounded-md focus:ring-4 focus:ring-[#E3AB23]/20 dark:focus:ring-yellow-accent/20 transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-[#024A76]/10 to-[#E3AB23]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
                <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-[#024A76] dark:text-gray-200 cursor-pointer transition-colors duration-200 group-hover:text-[#E3AB23] dark:group-hover:text-yellow-accent">
                  Ține-mă minte pe acest dispozitiv
                </label>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="relative group">
              {/* Animated background layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#024A76] via-[#3471B8] to-[#E3AB23] rounded-xl transform rotate-1 opacity-20 blur-lg group-hover:opacity-30 transition-all duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#E3AB23] via-[#024A76] to-[#3471B8] rounded-xl transform -rotate-1 opacity-20 blur-lg group-hover:opacity-30 transition-all duration-300"></div>
              
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-lg font-semibold text-white bg-gradient-to-r from-[#024A76] via-[#3471B8] to-[#024A76] hover:from-[#024A76] hover:via-[#E3AB23] hover:to-[#3471B8] focus:outline-none focus:ring-4 focus:ring-[#E3AB23]/30 transition-all duration-500 hover:shadow-2xl hover:scale-105 transform backdrop-blur-sm
                  ${loading ? 'opacity-75 cursor-not-allowed scale-95' : 'hover:scale-105'}`}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {loading ? (
                  <span className="flex items-center space-x-3">
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Se procesează autentificarea...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Autentificare</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Smooth focus transitions */
        .group:focus-within label {
          transform: translateY(-2px);
        }
        
        /* Enhanced hover effects */
        .group:hover .absolute {
          opacity: 0.1;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;