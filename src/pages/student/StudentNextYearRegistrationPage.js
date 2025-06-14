  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile-First Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm mb-3 sm:mb-4">
            Înregistrare Anul Următor
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg px-4 sm:px-0">
            Completează informațiile pentru înregistrarea la anul următor
          </p>
        </div>

        {/* Mobile-Optimized Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#024A76] to-[#3471B8] rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              
              <h2 className="text-lg sm:text-xl font-semibold text-[#024A76] dark:text-blue-light mb-3 sm:mb-4">
                Procesul de înregistrare este gestionat de administratori
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                Înregistrarea pentru anul următor se realizează automat prin sistemul de alocare. 
                Administratorii vor procesa înregistrările în funcție de rezultatele academice și 
                creditele acumulate.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm sm:text-base mb-2">Verificare Automată</h3>
                  <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm">Sistemul verifică automat creditele acumulate și rezultatele</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 sm:p-6 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base mb-2">Procesare Rapidă</h3>
                  <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm">Înregistrările sunt procesate eficient de către sistem</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 sm:p-6 rounded-lg border border-purple-200 dark:border-purple-700 sm:col-span-2 lg:col-span-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h9a1 1 0 001-1z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-purple-800 dark:text-purple-300 text-sm sm:text-base mb-2">Notificare Automată</h3>
                  <p className="text-purple-600 dark:text-purple-400 text-xs sm:text-sm">Vei fi notificat automat despre statusul înregistrării</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-yellow-accent/10 dark:to-yellow-accent/5 border border-[#E3AB23]/30 dark:border-yellow-accent/30 rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-[#024A76] dark:text-yellow-accent text-sm sm:text-base mb-2">
                  Informații importante
                </h3>
                <ul className="text-left text-gray-600 dark:text-gray-400 text-xs sm:text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-[#E3AB23] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Asigură-te că ai promovat toate materiile obligatorii din anul curent
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-[#E3AB23] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Verifică că ai acumulat numărul minim de credite necesare
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-[#E3AB23] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Contactează secretariatul pentru întrebări specifice
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ); 