# Ionix Group — App

Next.js (App Router) + Supabase. Login vero per squadra e clienti, bacheca lavori (stile Trello) per progetto, documenti (contratto/preventivo) e scadenza di consegna.

## Avviare in locale

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Apri **SQL Editor** nel progetto e incolla tutto il contenuto di `supabase/schema.sql`, poi esegui (sicuro da rieseguire più volte). Crea le tabelle, i permessi, e due progetti/task di esempio.
3. In **Settings → API** copia *Project URL* e *anon public key*.
4. Nella stessa pagina (potrebbe essere sotto "API Keys" → "Legacy" o una chiave chiamata *secret*) copia anche la **service_role key** — è segreta, usata solo dal server per creare gli account.
5. Copia `.env.example` in `.env.local` e incolla i tre valori.
6. `npm install && npm run dev`, poi apri `http://localhost:3000`.

## Creare il primo account (squadra)

Senza almeno un account "squadra" non si può entrare nell'app (e senza un account squadra non si possono creare gli altri account dalla pagina Account). Un'unica volta, a mano:

1. Su Supabase: **Authentication → Users → Add user**. Inserisci la tua email e una password, spunta **Auto Confirm User**, crea.
2. Copia l'**ID** dell'utente appena creato (visibile nella lista, formato lungo tipo `a1b2c3d4-...`).
3. Vai su **SQL Editor** e esegui, sostituendo l'ID:
   ```sql
   insert into profiles (id, role, full_name) values ('INCOLLA-ID-QUI', 'team', 'Il tuo nome');
   ```
4. Ora puoi accedere su `/login` con quella email/password. Da lì, tutti gli altri account (altri membri della squadra, clienti) si creano dalla pagina **Account** dentro l'app.

## Stato attuale

- **Login vero** (email/password, Supabase Auth) per tre tipi di account:
  - **Squadra** → `/board`: bacheca lavori per progetto (Da fare/In corso/Fatto, drag&drop), scadenza di consegna modificabile, milestone (tappe di lavorazione, alcune legate a una rata di pagamento), foto cantiere (con QR code per il cliente), presenze dei lavoratori, documenti (contratto/preventivo/fattura/altro, upload PDF, "visibile al cliente"), pagina **Squadra** (rubrica lavoratori con foto), pagina **Account** per creare nuovi accessi.
  - **Titolare** (`owner`) → tutto quello che vede "Squadra", più la pagina riservata **Notifiche** (`/board/notifiche`): milestone in scadenza e completate di recente, su tutti i cantieri.
  - **Cliente** → `/portal`: sola lettura, vede solo il proprio progetto — scadenza di consegna, stato dei pagamenti (colorato giallo/arancione/rosso in base a quanto manca alla scadenza, verde se pagato), foto cantiere, e i documenti marcati "visibile al cliente". Non vede mai la bacheca lavori, le milestone interne o le presenze.
- Le regole di accesso sono vere (Supabase RLS legata all'account che ha fatto login), non più permissive come nella prima versione.
- Il QR code sul pulsante "Mostra QR" (sezione foto, lato squadra) apre `/portal`: funziona scansionandolo da un telefono dove il cliente ha già fatto login (la sessione resta attiva nel browser del telefono).
- Font, colori e stile ricalcano il sito e il mockup del portale cliente.
- **Importante**: se avevi già un progetto Supabase collegato dalla versione precedente, devi rieseguire `supabase/schema.sql` per aggiungere le nuove tabelle (workers, attendance, milestones, photos) e il ruolo "owner" — è scritto per essere eseguito di nuovo senza errori.
- Non ancora collaudato con un vero progetto Supabase in questa sessione (qui non c'era `.env.local`): build e typecheck passano puliti, ma vale la pena un giro di prova reale prima di andare in produzione.

## Prossimi passi

- Notifiche milestone via email/WhatsApp (oggi solo nella pagina "Notifiche" in-app) — richiede collegare un servizio esterno.
- Timeline settimanale nel portale cliente (per ora ha scadenza, pagamenti, foto e documenti — vedi il mockup già condiviso per il disegno completo).
- Recupero password self-service per i clienti (oggi la password si comunica a mano dalla pagina Account).
