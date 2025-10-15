# Bug-ul de la alocarea automată

Era ziua procesării înscrierilor pentru materiile opționale. Sistemul nostru trebuia să aloce automat 2000+ de studenți la cursuri în funcție de medii și preferințe. 

**Problema**: După 3 ore de rulare, algoritmul se oprea brusc cu eroarea "Cannot read property 'length' of undefined". Studenții cu medii mari rămâneau nealocați, în timp ce cei cu medii mici primeau locurile.

**Cauza**: În codul de sortare, aveam:
```javascript
studentiCuPreferinte.sort((a, b) => b.media - a.media);
```

Dar pentru unii studenți, câmpul `media` era `null` sau `undefined`. JavaScript convertea automat `null - 10` în `NaN`, iar sortarea devenea imprevizibilă.

**Soluția**:
```javascript
studentiCuPreferinte.sort((a, b) => (b.media || 0) - (a.media || 0));
```

**Lecția**: Întotdeauna validează datele înainte de operații critice. Un simplu `|| 0` a salvat înscrierea a mii de studenți.