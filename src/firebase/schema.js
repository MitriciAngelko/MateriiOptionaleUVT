// În colecția 'materii', adăugăm:
studentiInscrisi: [
  {
    id: string, // ID-ul studentului
    nume: string // Numele complet al studentului
  }
],
limitaStudenti: number, // Numărul maxim de studenți care se pot înscrie

// În colecția 'users', pentru studenți adăugăm:
materiiInscrise: [string], // Array de ID-uri ale materiilor la care s-a înscris studentul 
pachetAles: string, // ID-ul pachetului ales (null dacă nu a ales încă)

// În colecția 'pachete':
{
  id: string,
  nume: string,
  materii: [
    {
      id: string, // ID-ul materiei
      nume: string // Numele materiei
    }
  ]
} 