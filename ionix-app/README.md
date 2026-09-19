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

- **Login vero** (email/password, Supabase Auth) per due tipi di account:
  - **Squadra** → `/board`: bacheca lavori per progetto (Da fare/In corso/Fatto, drag&drop), scadenza di consegna modificabile, documenti (contratto/preventivo/altro, upload PDF, "visibile al cliente"), pagina **Account** per creare nuovi accessi.
  - **Cliente** → `/portal`: sola lettura, vede solo il proprio progetto — scadenza di consegna e i documenti marcati "visibile al cliente". Non vede mai la bacheca lavori.
- Le regole di accesso sono vere (Supabase RLS legata all'account che ha fatto login), non più permissive come nella prima versione.
- Font, colori e stile ricalcano il sito e il mockup del portale cliente.

## Prossimi passi

- Timeline settimanale nel portale cliente (per ora ha solo scadenza + documenti — vedi il mockup già condiviso per il disegno completo).
- Aggiornamento settimanale da cantiere (foto + stato in un tap, lato squadra).
- Recupero password self-service per i clienti (oggi la password si comunica a mano dalla pagina Account).
