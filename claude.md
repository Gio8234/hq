## 1. VISIONE DEL PROGETTO & ATMOSFERA
**RetroHQ** non è una semplice dashboard di produttività; è un *rifugio digitale*. L'obiettivo è ricreare l'atmosfera nostalgica, tranquilla e riflessiva dei vecchi sistemi operativi degli anni '80/'90 (stile Classic Macintosh o Windows 95/98), fusi con l'estetica moderna **Lo-Fi Chill** e accogliente. 

Quando l'utente entra in RetroHQ, deve percepire un rallentamento del ritmo frenetico del web moderno: colori caldi, angoli smussati ma strutture geometriche stabili, font monospazio ed elementi che invitano alla focalizzazione, alla scrittura e alla pianificazione strategica.

---

## 2. DESIGN SYSTEM (RETRÒ-CHILL)

L'intera interfaccia si basa su una palette cromatica desaturata, calda e rilassante, che riduce l'affaticamento visivo e stimola la concentrazione.

### 2.1 Palette Colori
* **Sfondo Principale (Base Canvas):** `#F4EFE6` (un crema caldo e morbido, simile alla carta pregiata o alla plastica ingiallita dal tempo in modo elegante).
* **Sfondo Card/Finestre:** `#FFFFFF` (bianco puro per far risaltare il testo, con bordi definiti).
* **Colore Testo Principale:** `#2E2A25` (un marrone espresso scurissimo, meno aggressivo del nero puro).
* **Accent 1 (Verde Salvia Retro):** `#5F7D67` (colore principale per pulsanti di successo, task completati, mood rilassante).
* **Accent 2 (Terracotta Caldo):** `#C87A65` (per scadenze, elementi attivi o focus).
* **Accent 3 (Giallo Miele Ochre):** `#D9A05B` (per note importanti, obiettivi primari).
* **Ombre e Dettagli Retro:** `#DDD5C7` per i bordi secondari; ombre nette e solide (`box-shadow: 4px 4px 0px #2E2A25`) per dare un effetto tridimensionale in stile 8-bit/16-bit moderno.

### 2.2 Tipografia
* **Font di Sistema / Monospazio (Dati e Interfaccia):** `JetBrains Mono`, `Fira Code`, o il fallback nativo `Courier New`, `monospace`. Da usare per contatori, tag, bottoni e date.
* **Font per i Contenuti (Note e Titoli):** `Georgia`, `serif` o `Baskerville` per un feeling editoriale, intimo e riflessivo.

### 2.3 Elementi Grafici & UI Patches
* **Finestre stile OS Vintage:** Ogni sezione principale (Task, Note, Progetti) deve essere racchiusa in una "finestra" con una barra del titolo superiore (`.window-header`) che include finti pulsanti di riduzione a icona/chiusura (stile Mac OS Classic).
* **Bordi:** Spessi `2px` o `3px` solidi col colore `#2E2A25`.
* **Effetti di Hover:** Transizioni fluide (200ms) ma senza esagerare con animazioni futuristiche. Gli hover cambiano il background o spostano leggermente l'elemento simulando la pressione fisica (`transform: translate(2px, 2px); box-shadow: 2px 2px 0px #2E2A25;`).

---

## 3. ARCHITETTURA DEI FILE
Il progetto deve essere leggero, veloce e privo di build-step (no Webpack, no Vite, no React). Solo puro stack nativo:

```text
retro-hq/
│
├── index.html          # Struttura semantica e scheletro dell'HQ
├── css/
│   └── style.css       # Design System, variabili CSS e layout
└── js/
    ├── app.js          # Inizializzazione, gestione stato globale e interazioni UI
    └── storage.js      # Wrapper per il salvataggio in LocalStorage (persistenza dati)


Python
markdown_content = """# RetroHQ — Specifiche di Progetto & Prompt di Sistema (claude.md)

Questo file funge da blueprint architetturale, guida di design e istruzione di sistema (System Prompt) per lo sviluppo di **RetroHQ**: il tuo quarto generale digitale. È ottimizzato per essere letto da assistenti AI (come Claude, Cursor o v0) per generare il codice dell'applicazione in modo coerente e senza allucinazioni.

---

## 1. VISIONE DEL PROGETTO & ATMOSFERA
**RetroHQ** non è una semplice dashboard di produttività; è un *rifugio digitale*. L'obiettivo è ricreare l'atmosfera nostalgica, tranquilla e riflessiva dei vecchi sistemi operativi degli anni '80/'90 (stile Classic Macintosh o Windows 95/98), fusi con l'estetica moderna **Lo-Fi Chill** e accogliente. 

Quando l'utente entra in RetroHQ, deve percepire un rallentamento del ritmo frenetico del web moderno: colori caldi, angoli smussati ma strutture geometriche stabili, font monospazio ed elementi che invitano alla focalizzazione, alla scrittura e alla pianificazione strategica.

---

## 2. DESIGN SYSTEM (RETRÒ-CHILL)

L'intera interfaccia si basa su una palette cromatica desaturata, calda e rilassante, che riduce l'affaticamento visivo e stimola la concentrazione.

### 2.1 Palette Colori
* **Sfondo Principale (Base Canvas):** `#F4EFE6` (un crema caldo e morbido, simile alla carta pregiata o alla plastica ingiallita dal tempo in modo elegante).
* **Sfondo Card/Finestre:** `#FFFFFF` (bianco puro per far risaltare il testo, con bordi definiti).
* **Colore Testo Principale:** `#2E2A25` (un marrone espresso scurissimo, meno aggressivo del nero puro).
* **Accent 1 (Verde Salvia Retro):** `#5F7D67` (colore principale per pulsanti di successo, task completati, mood rilassante).
* **Accent 2 (Terracotta Caldo):** `#C87A65` (per scadenze, elementi attivi o focus).
* **Accent 3 (Giallo Miele Ochre):** `#D9A05B` (per note importanti, obiettivi primari).
* **Ombre e Dettagli Retro:** `#DDD5C7` per i bordi secondari; ombre nette e solide (`box-shadow: 4px 4px 0px #2E2A25`) per dare un effetto tridimensionale in stile 8-bit/16-bit moderno.

### 2.2 Tipografia
* **Font di Sistema / Monospazio (Dati e Interfaccia):** `JetBrains Mono`, `Fira Code`, o il fallback nativo `Courier New`, `monospace`. Da usare per contatori, tag, bottoni e date.
* **Font per i Contenuti (Note e Titoli):** `Georgia`, `serif` o `Baskerville` per un feeling editoriale, intimo e riflessivo.

### 2.3 Elementi Grafici & UI Patches
* **Finestre stile OS Vintage:** Ogni sezione principale (Task, Note, Progetti) deve essere racchiusa in una "finestra" con una barra del titolo superiore (`.window-header`) che include finti pulsanti di riduzione a icona/chiusura (stile Mac OS Classic).
* **Bordi:** Spessi `2px` o `3px` solidi col colore `#2E2A25`.
* **Effetti di Hover:** Transizioni fluide (200ms) ma senza esagerare con animazioni futuristiche. Gli hover cambiano il background o spostano leggermente l'elemento simulando la pressione fisica (`transform: translate(2px, 2px); box-shadow: 2px 2px 0px #2E2A25;`).

---

## 3. ARCHITETTURA DEI FILE
Il progetto deve essere leggero, veloce e privo di build-step (no Webpack, no Vite, no React). Solo puro stack nativo:

```text
retro-hq/
│
├── index.html          # Struttura semantica e scheletro dell'HQ
├── css/
│   └── style.css       # Design System, variabili CSS e layout
└── js/
    ├── app.js          # Inizializzazione, gestione stato globale e interazioni UI
    └── storage.js      # Wrapper per il salvataggio in LocalStorage (persistenza dati)
4. SPECIFICHE DEI MODULI (LE FUNZIONALITÀ)
4.1 Il Centro di Controllo (Dashboard & Dock)
La parte superiore o laterale presenta un "Dock" minimale e fisso per navigare tra le sezioni o filtrare la vista.

Vibe Check giornaliero: Un piccolo spazio testuale in alto dove l'utente può scrivere la sua "intenzione del giorno" (es. "Oggi si progetta con calma").

Orologio e Data Retro: Un widget che mostra l'ora e la data corrente in formato monospazio rigoroso.

4.2 L'Atelier dei Progetti (Project Board)
Un'area dedicata alla macro-pianificazione delle attività commerciali o personali.

Ogni progetto è una "cartella visuale" o una card retro.

Campi: Titolo del Progetto, Descrizione Breve, Tag di Categoria (es. Marketing, Sviluppo, Riflessione), Stato (Attivo, In Pausa, Concluso).

Cliccando su un progetto, l'interfaccia filtra i task mostrando solo quelli legati ad esso.

4.3 La Matrice dei Task (To-Do List Ragionata)
Non una lista confusionaria, ma uno spazio ordinato diviso in:

Focus Odierno (Massimo 3 task cruciali per evitare il burnout).

In Coda (Tutto il resto).

Interazione: Checkbox custom (quadratini retro che si riempiono con una "X" o con il colore verde salvia quando smarcati). Possibilità di aggiungere al volo un task legandolo a un progetto esistente.

4.4 Il Taccuino delle Idee (Zibaldone / Note Generali)
Uno stream continuo e libero per annotare pensieri sulla propria attività, insight, idee notturne o review settimanali.

Interfaccia: Stile foglio di carta a righe o terminale pulito.

Funzioni: Creazione di una nuova nota al volo con timestamp automatico. Possibilità di espandere/ridurre le note lunghe. Ricerca testuale semplice tra le note.

4.5 L'Angolo degli Obiettivi (Milestones)
Uno spazio dove tracciare gli obiettivi a lungo termine (es. "Raggiungere 10 clienti", "Lanciare il nuovo sito").

Visualizzazione ad elenco con una barra di avanzamento minimalista creata in puro CSS (caratteri grafici tipo [██████░░░░] 60%).

4.6 Il Mangiadischi del Focus (Ambient & Pomodoro Timer)
Un widget speciale posizionato nell'angolo dell'HQ, disegnato come un vecchio lettore di cassette o una radio vintage.

Funzionalità: Un timer di focus (25 min lavoro / 5 min pausa).

Dettaglio estetico: Quando il timer è attivo, una piccola animazione CSS simula le bobine della cassetta che girano. Al termine, un suono morbido (o un flash visivo rilassante) avvisa l'utente.

5. REQUISITI TECNICI DI IMPLEMENTAZIONE (PER CLAUDE)
Quando implementi il codice basandoti su questo file, rispetta tassativamente le seguenti regole:

Zero Dipendenze Esterne: Non utilizzare framework CSS (no Tailwind, no Bootstrap) o librerie JS. Tutto deve essere scritto in CSS Vanilla (utilizzando Custom Properties per i colori) e JS ES6+.

Persistenza in LocalStorage: Ogni inserimento, modifica, cancellazione o cambio di stato (progetti, task, note, obiettivi, intenzione del giorno) deve essere immediatamente salvato nel LocalStorage in modo che rinfrescando la pagina nulla vada perduto. Struttura i dati in modo pulito in un unico oggetto di stato o chiavi separate ben definite.

Layout Responsivo ma Guidato: L'interfaccia deve dare il meglio di sé su Desktop (il vero Headquarters di lavoro), organizzandosi preferibilmente in una griglia ordinata a due o tre colonne (es. Colonna 1: Progetti e Obiettivi; Colonna 2: Task e Timer; Colonna 3: Note Libere). Su Mobile deve impilarsi elegantemente senza rompere i bordi o le ombre.

Accessibilità e Semantica: Usa tag HTML5 appropriati (<main>, <section>, <article>, <header>, <nav>). Il contrasto tra il testo marrone espresso (#2E2A25) e lo sfondo crema (#F4EFE6) deve essere preservato per una lettura ottimale.

Codice Modulare e Pulito: Dividi le funzioni JS per responsabilità. Evita un unico blocco monolitico disordinato; usa funzioni di renderizzazione chiare (es. renderProjects(), renderTasks()) richiamate ogni volta che lo stato globale cambia.

6. ESEMPIO DI STRUTTURA HTML DI RIFERIMENTO (UI PATTERN)
Usa questa struttura di classi per mantenere lo stile vintage delle finestre:

HTML
<div class="retro-window">
  <div class="window-header">
    <span class="window-title">taccuino_idee.txt</span>
    <div class="window-controls">
      <span class="control-btn min"></span>
      <span class="control-btn max"></span>
      <span class="control-btn close"></span>
    </div>
  </div>
  <div class="window-content">
    </div>
</div>