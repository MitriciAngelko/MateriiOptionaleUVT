# Cel mai urât bug pe care l-am întâlnit

## Povestea

Acum câțiva ani, lucram la o aplicație de e-commerce cu milioane de utilizatori. Era Black Friday, iar traficul era de 10 ori mai mare decât de obicei. Totul părea să meargă perfect până când, la ora 14:30, au început să apară rapoarte că utilizatorii nu pot finaliza comenzile.

## Simptomele

- Utilizatorii ajungeau la pagina de checkout
- Completau toate datele corect
- Apăsau butonul "Finalizează comanda"
- Pagina se încărca la infinit, apoi afișa eroarea "Ceva nu a mers bine"
- Dar cel mai ciudat: bug-ul apărea doar la utilizatorii cu nume care conțineau caractere speciale (ă, î, ș, ț, â)

## Prima investigație (greșită)

Inițial am crezut că e o problemă de encoding UTF-8. Am verificat:
- Baza de date (era configurată corect pentru UTF-8)
- API-ul (procesă corect caracterele speciale)
- Frontend-ul (afișa corect numele)

Totul părea în regulă, dar bug-ul persista.

## Descoperirea șocantă

După 3 ore de debugging intens, am descoperit adevărata cauză. În codul pentru generarea ID-urilor unice ale comenzilor, cineva folosise această funcție:

```javascript
function generateOrderId(customerName) {
    // Generează un ID unic bazat pe timestamp și numele clientului
    const timestamp = Date.now();
    const nameHash = btoa(customerName); // Aici era problema!
    return `ORDER_${timestamp}_${nameHash}`;
}
```

## Problema reală

Funcția `btoa()` din JavaScript nu poate procesa caractere non-ASCII! Când întâlnea caractere precum ă, î, ș, ț, â, funcția arunca o excepție care nu era prinsă nicăieri, blocând întregul proces de checkout.

## Soluția

```javascript
function generateOrderId(customerName) {
    const timestamp = Date.now();
    // Înlocuim btoa() cu o soluție care funcționează cu UTF-8
    const nameHash = btoa(encodeURIComponent(customerName));
    return `ORDER_${timestamp}_${nameHash}`;
}
```

Sau și mai bine:

```javascript
function generateOrderId(customerName) {
    const timestamp = Date.now();
    // Folosim crypto API pentru un hash mai robust
    const encoder = new TextEncoder();
    const data = encoder.encode(customerName);
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `ORDER_${timestamp}_${hashHex.substring(0, 8)}`;
    });
}
```

## Lecțiile învățate

1. **Testează cu date reale**: Dacă am fi testat cu nume românești de la început, am fi descoperit problema
2. **Error handling**: Orice funcție care poate eșua trebuie să aibă try-catch
3. **Monitoring**: Am implementat alerting pentru excepții necunoscute
4. **Code review**: Acum verificăm întotdeauna compatibilitatea cu caractere speciale

## Impactul

- 2.3 milioane de euro pierderi în 3 ore de Black Friday
- 15.000 de comenzi eșuate
- Încrederea clienților afectată
- Dar am învățat o lecție valoroasă despre importanța testării cu date diverse

Acest bug m-a învățat că cele mai urâte probleme sunt adesea cele mai simple - o singură linie de cod poate să blocheze o întreagă platformă de milioane de euro.