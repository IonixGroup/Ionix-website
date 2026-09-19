# Ionix Group — App

Next.js (App Router) + Supabase. Oggi c'è la bacheca lavori (stile Trello) per la squadra, per progetto.

## Avviare in locale

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Apri **SQL Editor** nel progetto e incolla il contenuto di `supabase/schema.sql`, poi esegui. Crea le tabelle `projects` e `tasks` e inserisce due progetti/task di esempio.
3. In **Settings → API** copia *Project URL* e *anon public key*.
4. Copia `.env.example` in `.env.local` e incolla i due valori.
5. `npm install && npm run dev`, poi apri `http://localhost:3000` (reindirizza a `/board`).

## Stato attuale

- `/board` — bacheca lavori per progetto: colonne Da fare / In corso / Fatto, drag&drop, aggiungi/elimina attività. Solo per la squadra — non c'è ancora un login, quindi **chiunque abbia l'URL può modificarla** (vedi nota di sicurezza in `supabase/schema.sql`). Non darla ancora in mano al cliente.
- Font, colori e stile ricalcano esattamente il sito e il mockup del portale cliente.

## Prossimi passi

- Login squadra (Supabase Auth) e regole di accesso vere al posto delle policy temporanee.
- Portale cliente (timeline settimanale, foto, documenti) — vedi il mockup già condiviso.
- Aggiornamento settimanale da cantiere (foto + stato in un tap).
