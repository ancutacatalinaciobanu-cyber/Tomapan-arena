# ȚOMAPAN Arena – multiplayer pentru clasa a VII-a

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fancutacatalinaciobanu-cyber%2FTomapan-arena)

Apăsați butonul pentru a publica folosind configurația gratuită inclusă.

## Ce include
- Până la 35 de elevi, fiecare pe telefon, fără cont.
- Profesorul creează o cameră cu cod de 6 caractere și QR.
- 7 runde, litere aleatorii sau alese, cronometru sincronizat de server.
- Țară, Oraș, Munte, Apă, Plantă, Animal, Nume.
- Verificare de profesor a fiecărui răspuns; 10 puncte corect unic, 5 corect repetat, 0 invalid.
- Clasament în timp real după punctare.

## Pornire locală
1. Instalați Node.js 22+.
2. În directorul proiectului: `npm install`, apoi `npm start`.
3. Accesați `http://localhost:3000` pe calculator.

## Publicare pe Render
Proiectul include `render.yaml`: serviciu web Node, o singură instanță, build `npm ci --omit=dev`, start `npm start` și health check `/healthz`. Configurația folosește planul gratuit. Camerele rămân în memoria unei singure instanțe.

## Testare
Rulați `npm ci`, apoi `npm test`. Suita simulează 35 de elevi, verifică accesul, aceeași limită de timp, transmiterea răspunsurilor, reconectarea, corectarea, scorurile, cele 7 runde, QR-ul și expirarea cronometrului.
Pentru verificarea serviciului publicat: `TEST_URL=https://ADRESA.onrender.com npm test`.

Ultimul test local: 35 de conexiuni simulate, 7 runde, toate verificările reușite. Nu reprezintă un test pe 35 de telefoane reale sau pe rețeaua școlii.

## Pentru telefoanele elevilor
Publicați proiectul pe un serviciu de hosting Node.js care suportă WebSocket (de exemplu Render, Railway sau un VPS), cu comanda de pornire `npm start`. Deschideți adresa HTTPS publică și apăsați „Creează sesiune”. Elevii scanează QR-ul. **Nu este suficient să deschideți fișierul HTML direct în browser**.

## Atenționări
- Datele și punctajele sunt ținute în memoria serverului; se pierd la repornire/redeploy. Nu reporniți în timpul jocului.
- Profesorul își poate recupera sesiunea în aceeași filă/sesiune de browser; cheia este păstrată în sessionStorage. Nu o distribuiți.
- Un elev care știe codul poate intra sub un pseudonim; este un joc de clasă, nu un sistem de evaluare securizat.
- Profesorul validează răspunsurile, deoarece o simplă verificare a primei litere nu garantează că termenul există sau este în categoria corectă.
- QR-ul este generat de aplicație, fără serviciu extern.
- Recomandăm prenume sau pseudonime, nu date personale complete.


## LANȚ – joc pentru copiii mai mici

La aceeași adresă publică, deschideți `/lant/`. ȚOMAPAN rămâne disponibil la `/`.

- Patru categorii: **Lucruri, Animale, Nume, Țări**.
- **10 runde**, maximum **35 de jucători**, fiecare pe propriul dispozitiv.
- Profesorul creează sesiunea fără cont, distribuie codul sau QR-ul și așteaptă înscrierea tuturor copiilor.
- Cronometrul este comun și închide automat runda; profesorul o poate încheia mai devreme.
- Elevii pot retrimite răspunsurile cât timp runda este deschisă. Răspunsurile nu sunt afișate altor elevi înainte de publicarea punctajelor.
- Profesorul validează cuvintele: 10 puncte pentru răspuns valid și unic, 5 pentru răspuns valid repetat, 0 pentru răspuns invalid, gol sau cu altă inițială. Repetițiile se calculează doar între răspunsurile validate.
- Procentul fiecărui copil este `puncte / (40 × runde punctate) × 100`. Maximum 400 de puncte pe joc. Egalitățile primesc același loc.
- Profesorul poate corecta validitatea răspunsurilor celei mai recente runde punctate; totalurile și procentele se recalculează pentru toți copiii.
- Export CSV cu loc, nume, punctaj, procent și punctele fiecărei runde.
- Reconectare în aceeași filă, cu chei private separate pentru profesor și elevi. Codurile publice nu oferă controlul profesorului.

LANȚ folosește un modul și un namespace Socket.IO separate, fără a modifica regulile sau interfața ȚOMAPAN. Sesiunile sunt în memoria serverului și expiră după 24 de ore; se pierd și la repornire/republicare. Exportați rezultatele înainte de a închide activitatea.

`npm test` verifică ambele jocuri. Pentru LANȚ separat: `node tests/lant.cjs`; pentru serverul publicat: `TEST_URL=https://ADRESA.onrender.com node tests/lant.cjs`. Sunt verificate 35 de conexiuni simulate, cele 10 runde, reconectarea, permisiunile, cronometrul, punctajele, procentele și QR-ul.
