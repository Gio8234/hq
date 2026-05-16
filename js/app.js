/* ================================================================
   RetroHQ — app.js
   Window Manager + Tutti i moduli applicativi
================================================================ */

'use strict';

// ── Utility ───────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ================================================================
//  SOUND ENGINE  (Web Audio API, zero dipendenze)
// ================================================================
const Sound = (() => {
  let _ctx = null;

  function ctx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  // Costruisce un oscillatore con envelope attack/decay
  function osc(freq, dur, vol = 0.07, type = 'sine', freqEnd = null, delay = 0) {
    try {
      const ac   = ctx();
      const t    = ac.currentTime + delay;
      const node = ac.createOscillator();
      const gain = ac.createGain();

      node.connect(gain);
      gain.connect(ac.destination);

      node.type = type;
      node.frequency.setValueAtTime(freq, t);
      if (freqEnd) node.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      node.start(t);
      node.stop(t + dur + 0.05);
    } catch (_) {}
  }

  return {
    // Click morbido — tocco caldo su legno
    click()    { osc(310, 0.09, 0.055, 'triangle', 170); },

    // Apertura finestra — due note ascendenti soffuse
    open()     { osc(392, 0.28, 0.05, 'sine'); osc(523, 0.32, 0.045, 'sine', null, 0.07); },

    // Chiusura finestra — nota discendente
    close()    { osc(440, 0.22, 0.045, 'sine', 262); },

    // Minimizza — singolo tocco basso
    minimize() { osc(280, 0.12, 0.04, 'triangle'); },

    // Task completato — tripletta ascendente (do-mi-sol)
    complete() {
      osc(523, 0.35, 0.055, 'sine');
      osc(659, 0.38, 0.048, 'sine', null, 0.09);
      osc(784, 0.45, 0.042, 'sine', null, 0.18);
    },

    // Salvataggio / conferma — campana soffice
    save()     { osc(587, 0.38, 0.058, 'sine'); osc(740, 0.3, 0.035, 'sine', null, 0.05); },

    // Avviso limite — doppio tocco basso
    warn()     { osc(220, 0.15, 0.05, 'triangle'); osc(185, 0.15, 0.04, 'triangle', null, 0.18); },

    // Elimina — suono breve discendente
    delete_()  { osc(350, 0.14, 0.045, 'triangle', 200); },
  };
})();

// ── Stato globale ─────────────────────────────────────────────────
let state = Storage.load();

function persist() {
  Storage.save(state);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStats() {
  const k = todayKey();
  if (!state.stats[k]) state.stats[k] = { tasksDone: 0, notesSaved: 0, pomodoroSessions: 0 };
  return state.stats[k];
}

// ── Toast ─────────────────────────────────────────────────────────
let _toastTimer = null;

function showToast(msg, ms = 2500) {
  const el = $('#toast');
  $('#toast-message').textContent = msg;
  el.hidden = false;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

// ── Orologio ──────────────────────────────────────────────────────
function startClock() {
  const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const MESI   = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

  function tick() {
    const n = new Date();
    const pad = v => String(v).padStart(2, '0');
    $('#clock-time').textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
    $('#clock-date').textContent = `${GIORNI[n.getDay()]}, ${pad(n.getDate())} ${MESI[n.getMonth()]}`;
  }

  tick();
  setInterval(tick, 1000);
}

// ================================================================
//  WINDOW MANAGER
// ================================================================
const WM = (() => {

  let zTop = 10;

  const LABELS = {
    progetti:  'Progetti',
    task:      'Task Matrix',
    note:      'Taccuino',
    obiettivi: 'Obiettivi',
    timer:     'Mangiadischi',
    abitudini: 'Abitudini',
  };

  // Posizioni di apertura iniziale (a cascata)
  const SPAWN = {
    progetti:  { x: 120, y: 40  },
    task:      { x: 170, y: 70  },
    note:      { x: 220, y: 100 },
    obiettivi: { x: 150, y: 55  },
    timer:     { x: 260, y: 80  },
    abitudini: { x: 300, y: 90  },
  };

  function winEl(id) { return $(`#window-${id}`); }

  function focus(id) {
    const el = winEl(id);
    if (!el) return;
    zTop++;
    el.style.zIndex = zTop;
    $$('.os-window').forEach(w => w.classList.remove('is-focused'));
    el.classList.add('is-focused');
    updateTaskbar();
  }

  function open(id) {
    const el = winEl(id);
    if (!el) return;

    if (el.hidden) {
      const pos = SPAWN[id] || { x: 100, y: 60 };
      el.style.left = pos.x + 'px';
      el.style.top  = pos.y + 'px';
      el.classList.add('is-opening');
      el.hidden = false;
      // Trigger spring-in animation: remove class on next frame so transition fires
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.remove('is-opening'));
      });
    }

    el.classList.remove('is-minimized');
    Sound.open();
    focus(id);
  }

  function close(id) {
    const el = winEl(id);
    if (!el) return;
    el.hidden = true;
    el.classList.remove('is-minimized', 'is-focused', 'is-maximized');
    Sound.close();
    updateTaskbar();
  }

  function minimize(id) {
    const el = winEl(id);
    if (!el || el.hidden) return;
    el.classList.toggle('is-minimized');
    Sound.minimize();
    updateTaskbar();
  }

  function maximize(id) {
    const el = winEl(id);
    if (!el) return;

    if (el.classList.contains('is-maximized')) {
      el.classList.remove('is-maximized');
      const prev = el._prevRect;
      if (prev) {
        el.style.left   = prev.x + 'px';
        el.style.top    = prev.y + 'px';
        el.style.width  = prev.w ? prev.w + 'px' : '';
        el.style.height = prev.h ? prev.h + 'px' : '';
      }
    } else {
      el._prevRect = {
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      };
      el.classList.add('is-maximized');
    }
    focus(id);
  }

  function initDrag(winEl, titlebarEl) {
    let ox, oy, startL, startT, active = false;

    function onDown(cx, cy) {
      active  = true;
      ox      = cx;
      oy      = cy;
      startL  = winEl.offsetLeft;
      startT  = winEl.offsetTop;
      document.body.style.userSelect = 'none';
      focus(winEl.dataset.windowId);
    }

    function onMove(cx, cy) {
      if (!active) return;
      const desktop = $('#desktop');
      const maxX = desktop.clientWidth  - winEl.offsetWidth;
      const maxY = desktop.clientHeight - 40;
      const nx = Math.max(0, Math.min(maxX, startL + cx - ox));
      const ny = Math.max(0, Math.min(maxY, startT + cy - oy));
      winEl.style.left = nx + 'px';
      winEl.style.top  = ny + 'px';
    }

    function onUp() {
      active = false;
      document.body.style.userSelect = '';
    }

    // Mouse
    titlebarEl.addEventListener('mousedown', e => {
      if (e.target.closest('.os-ctrl')) return;
      if (winEl.classList.contains('is-maximized')) return;
      onDown(e.clientX, e.clientY);

      const mm = e2 => onMove(e2.clientX, e2.clientY);
      const mu = () => { onUp(); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
      document.addEventListener('mousemove', mm);
      document.addEventListener('mouseup', mu);
    });

    // Touch
    titlebarEl.addEventListener('touchstart', e => {
      if (e.target.closest('.os-ctrl')) return;
      if (winEl.classList.contains('is-maximized')) return;
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);

      const tm = e2 => { const t2 = e2.touches[0]; onMove(t2.clientX, t2.clientY); };
      const tu = () => { onUp(); titlebarEl.removeEventListener('touchmove', tm); titlebarEl.removeEventListener('touchend', tu); };
      titlebarEl.addEventListener('touchmove', tm, { passive: true });
      titlebarEl.addEventListener('touchend', tu);
    }, { passive: true });

    // Focus al click sul body della finestra
    winEl.addEventListener('mousedown', () => focus(winEl.dataset.windowId));
  }

  function updateTaskbar() {
    const bar = $('#taskbar-items');
    bar.innerHTML = '';

    $$('.os-window').forEach(win => {
      const id = win.dataset.windowId;
      if (win.hidden) return;

      const btn = document.createElement('button');
      btn.className  = 'taskbar-btn';
      btn.dataset.taskbar = id;
      btn.textContent = LABELS[id] || id;
      btn.setAttribute('role', 'listitem');

      if (win.classList.contains('is-minimized')) btn.classList.add('is-minimized');
      if (win.classList.contains('is-focused'))   btn.classList.add('is-active');

      btn.addEventListener('click', () => {
        if (win.classList.contains('is-minimized')) {
          win.classList.remove('is-minimized');
          focus(id);
        } else if (win.classList.contains('is-focused')) {
          win.classList.add('is-minimized');
          win.classList.remove('is-focused');
          updateTaskbar();
        } else {
          focus(id);
        }
      });

      bar.appendChild(btn);
    });
  }

  function initAll() {
    $$('.os-window').forEach(win => {
      const tb = win.querySelector('.os-titlebar');
      if (tb) initDrag(win, tb);
    });

    // Delegazione eventi sui bottoni os-ctrl
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const target = btn.dataset.target;
      if (action === 'close')    close(target);
      if (action === 'minimize') minimize(target);
      if (action === 'maximize') maximize(target);
    });

    // Icone desktop — doppio click apre la finestra
    $$('.desktop-icon').forEach(icon => {
      icon.addEventListener('click', () => open(icon.dataset.window));
    });
  }

  return { open, close, minimize, maximize, focus, updateTaskbar, initAll };
})();

// ================================================================
//  VIBE CHECK
// ================================================================
function initVibe() {
  const input = $('#vibe-input');
  input.value = state.vibe || '';
  input.addEventListener('input', () => {
    state.vibe = input.value;
    persist();
  });
}

// ================================================================
//  PROGETTI
// ================================================================
let activeProjectFilter = 'tutti';
let selectedProjectId   = null;

function syncTaskFormProject() {
  const sel = $('#task-project-select');
  if (sel && selectedProjectId) sel.value = selectedProjectId;
}

function renderProjects() {
  const list   = $('#project-list');
  const empty  = $('#projects-empty');
  const select = $('#task-project-select');

  // Aggiorna select nei task
  const taskSelVal = select ? select.value : '';
  if (select) {
    select.innerHTML = '<option value="">— Progetto —</option>';
    state.projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.titolo;
      select.appendChild(opt);
    });
    select.value = taskSelVal;
  }

  let visible = state.projects.filter(p =>
    activeProjectFilter === 'tutti' || p.stato === activeProjectFilter
  );

  // Rimuovi vecchi item (non il placeholder)
  $$('.project-card', list).forEach(c => c.remove());

  if (visible.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  visible.forEach(p => {
    const li = document.createElement('li');
    li.className = 'project-card' + (p.id === selectedProjectId ? ' is-selected' : '');
    li.dataset.projectId = p.id;
    li.innerHTML = `
      <div class="project-card-header">
        <span class="project-card-title">${esc(p.titolo)}</span>
        <div class="card-actions">
          <button class="btn-icon" data-edit-project="${p.id}" title="Modifica" aria-label="Modifica ${esc(p.titolo)}">✎</button>
          <button class="btn-icon btn-icon--delete" data-delete-project="${p.id}" title="Elimina" aria-label="Elimina ${esc(p.titolo)}">✕</button>
        </div>
      </div>
      ${p.descrizione ? `<p class="project-card-desc">${esc(p.descrizione)}</p>` : ''}
      <div class="project-card-footer">
        <span class="tag tag--${p.tag}">${esc(p.tag)}</span>
        <span class="status-badge status-badge--${p.stato}">${esc(p.stato)}</span>
      </div>
    `;

    // Click sulla card = filtra i task
    li.addEventListener('click', e => {
      if (e.target.closest('[data-edit-project], [data-delete-project]')) return;
      if (selectedProjectId === p.id) {
        selectedProjectId = null;
      } else {
        selectedProjectId = p.id;
        WM.open('task');
        syncTaskFormProject();
      }
      renderProjects();
      renderTasks();
    });

    list.appendChild(li);
  });

  // Banner filtro nella finestra task
  const banner = $('#project-filter-banner');
  if (selectedProjectId) {
    const p = state.projects.find(pr => pr.id === selectedProjectId);
    if (p) {
      $('#filter-banner-text').textContent = `Progetto: ${p.titolo}`;
      banner.hidden = false;
    }
  } else {
    banner.hidden = true;
  }
}

function openModalProgetto(project = null) {
  const modal = $('#modal-progetto');
  $('#progetto-edit-id').value    = project ? project.id : '';
  $('#progetto-titolo').value     = project ? project.titolo : '';
  $('#progetto-descrizione').value = project ? (project.descrizione || '') : '';
  $('#progetto-tag').value        = project ? project.tag : 'altro';
  $('#progetto-stato').value      = project ? project.stato : 'attivo';
  $('#modal-progetto-title').textContent = project ? 'modifica_progetto.cfg' : 'nuovo_progetto.cfg';
  modal.hidden = false;
  $('#progetto-titolo').focus();
}

function closeModalProgetto() { $('#modal-progetto').hidden = true; }

function initProgetti() {
  $('#btn-nuovo-progetto').addEventListener('click', () => openModalProgetto());
  $('#modal-progetto-close').addEventListener('click', closeModalProgetto);
  $('#modal-progetto-annulla').addEventListener('click', closeModalProgetto);
  $('#modal-progetto').addEventListener('click', e => { if (e.target === e.currentTarget) closeModalProgetto(); });

  // Delegazione edit/delete
  $('#project-list').addEventListener('click', e => {
    const editBtn   = e.target.closest('[data-edit-project]');
    const deleteBtn = e.target.closest('[data-delete-project]');

    if (editBtn) {
      const p = state.projects.find(p => p.id === editBtn.dataset.editProject);
      if (p) openModalProgetto(p);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.deleteProject;
      if (confirm('Eliminare questo progetto?')) {
        state.projects = state.projects.filter(p => p.id !== id);
        if (selectedProjectId === id) selectedProjectId = null;
        Sound.delete_();
        persist();
        renderProjects();
        renderTasks();
        showToast('Progetto eliminato.');
      }
    }
  });

  // Filtri stato
  $$('[data-filter]', $('#window-progetti')).forEach(btn => {
    btn.addEventListener('click', () => {
      activeProjectFilter = btn.dataset.filter;
      $$('[data-filter]', $('#window-progetti')).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProjects();
    });
  });

  // Submit form
  $('#form-progetto').addEventListener('submit', e => {
    e.preventDefault();
    const titolo = $('#progetto-titolo').value.trim();
    if (!titolo) return;

    const editId = $('#progetto-edit-id').value;
    const data = {
      titolo,
      descrizione: $('#progetto-descrizione').value.trim(),
      tag:    $('#progetto-tag').value,
      stato:  $('#progetto-stato').value,
    };

    Sound.save();
    if (editId) {
      const idx = state.projects.findIndex(p => p.id === editId);
      if (idx !== -1) state.projects[idx] = { ...state.projects[idx], ...data };
      showToast('Progetto aggiornato.');
    } else {
      state.projects.push({ id: uid(), createdAt: Date.now(), ...data });
      showToast('Progetto creato!');
    }

    persist();
    closeModalProgetto();
    renderProjects();
    renderTasks();
  });
}

// ================================================================
//  TASK
// ================================================================
function renderTasks() {
  const listFocus = $('#task-list-focus');
  const listCoda  = $('#task-list-coda');

  $$('.task-item', listFocus).forEach(el => el.remove());
  $$('.task-item', listCoda).forEach(el => el.remove());

  let tasks = state.tasks;
  if (selectedProjectId) {
    tasks = tasks.filter(t => t.projectId === selectedProjectId);
  }

  const focus = tasks.filter(t => t.tipo === 'focus');
  const coda  = tasks.filter(t => t.tipo === 'coda');

  $('#focus-count').textContent = `[${focus.length}/3]`;
  $('#coda-count').textContent  = `[${coda.length}]`;

  $('#focus-empty').hidden = focus.length > 0;
  $('#coda-empty').hidden  = coda.length > 0;

  focus.forEach(t => listFocus.appendChild(buildTaskItem(t)));
  coda.forEach(t  => listCoda.appendChild(buildTaskItem(t)));
}

function buildTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.done ? ' is-done' : '');
  if (task.dueDate && !task.done) {
    const due = new Date(task.dueDate + 'T00:00:00');
    if (due < new Date(todayKey() + 'T00:00:00')) li.classList.add('is-overdue');
  }
  li.dataset.taskId = task.id;

  const proj = task.projectId ? state.projects.find(p => p.id === task.projectId) : null;
  const metaParts = [];
  if (task.createdAt) metaParts.push(formatDate(task.createdAt));
  if (task.dueDate) metaParts.push(`→ ${task.dueDate}`);
  if (proj) metaParts.push(`● ${esc(proj.titolo)}`);
  const meta = metaParts.join('  ');

  li.innerHTML = `
    <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''}
           aria-label="Segna come completato: ${esc(task.testo)}" />
    <div class="task-body">
      <span class="task-text">${esc(task.testo)}</span>
      <input type="text" class="task-inline-edit" value="${esc(task.testo).replace(/"/g, '&quot;')}" maxlength="200" aria-label="Modifica task" />
      ${meta ? `<span class="task-meta">${meta}</span>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn-link-timer ${timerLinkedTaskId === task.id ? 'is-linked' : ''}"
              data-link-timer="${task.id}" title="Focus su questo task" aria-label="Lega al timer">▶</button>
      <button class="btn-icon btn-icon--delete" data-delete-task="${task.id}" title="Elimina" aria-label="Elimina task">✕</button>
    </div>
  `;

  const checkbox  = li.querySelector('.task-checkbox');
  const textSpan  = li.querySelector('.task-text');
  const editInput = li.querySelector('.task-inline-edit');

  checkbox.addEventListener('change', () => toggleTask(task.id));

  textSpan.addEventListener('dblclick', () => {
    textSpan.style.display = 'none';
    editInput.style.display = 'block';
    editInput.focus();
    editInput.select();
  });

  function commitEdit() {
    const val = editInput.value.trim();
    if (val && val !== task.testo) { task.testo = val; persist(); }
    renderTasks();
  }
  editInput.addEventListener('blur', commitEdit);
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); editInput.blur(); }
    if (e.key === 'Escape') { editInput.value = task.testo; renderTasks(); }
  });

  return li;
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) {
    t.completedAt = Date.now();
    todayStats().tasksDone++;
    Sound.complete();
  } else {
    t.completedAt = null;
    todayStats().tasksDone = Math.max(0, todayStats().tasksDone - 1);
    Sound.click();
  }
  persist();
  renderTasks();
  renderStatsWidget();
}

function initTask() {
  $('#task-add-form').addEventListener('submit', e => {
    e.preventDefault();
    const testo = $('#task-input').value.trim();
    if (!testo) return;

    const tipo = $('#task-priority-select').value;

    if (tipo === 'focus') {
      const focusCount = state.tasks.filter(t => t.tipo === 'focus' && !t.done).length;
      if (focusCount >= 3) {
        Sound.warn();
        showToast('Max 3 task in Focus Odierno. Sposta o completa uno prima.');
        return;
      }
    }

    state.tasks.push({
      id: uid(),
      testo,
      tipo,
      done: false,
      projectId: $('#task-project-select').value || null,
      dueDate: $('#task-due-date').value || null,
      createdAt: Date.now(),
      completedAt: null,
    });
    $('#task-input').value = '';
    $('#task-due-date').value = '';
    persist();
    renderTasks();
    Sound.save();
    showToast('Task aggiunto!');
  });

  // Delegazione delete
  const deleteHandler = e => {
    const btn = e.target.closest('[data-delete-task]');
    if (!btn) return;
    state.tasks = state.tasks.filter(t => t.id !== btn.dataset.deleteTask);
    Sound.delete_();
    persist();
    renderTasks();
    showToast('Task eliminato.');
  };

  $('#task-list-focus').addEventListener('click', deleteHandler);
  $('#task-list-coda').addEventListener('click', deleteHandler);

  const linkTimerHandler = e => {
    const btn = e.target.closest('[data-link-timer]');
    if (!btn) return;
    Timer.linkTask(btn.dataset.linkTimer);
    WM.open('timer');
    Sound.click();
  };
  $('#task-list-focus').addEventListener('click', linkTimerHandler);
  $('#task-list-coda').addEventListener('click', linkTimerHandler);

  // Clear filtro progetto
  $('#btn-clear-filter').addEventListener('click', () => {
    selectedProjectId = null;
    renderProjects();
    renderTasks();
  });
}

// ================================================================
//  NOTE
// ================================================================
let noteSearchQuery = '';

function renderNotes() {
  const stream = $('#note-stream');
  $$('.note-card', stream).forEach(c => c.remove());

  let notes = [...state.notes].reverse();
  if (noteSearchQuery) {
    const q = noteSearchQuery.toLowerCase();
    notes = notes.filter(n => n.testo.toLowerCase().includes(q));
  }

  $('#notes-empty').hidden = notes.length > 0;

  notes.forEach(note => {
    const article = document.createElement('article');
    article.className = 'note-card' + (note.testo.length > 200 ? ' is-collapsed' : '');
    article.dataset.noteId = note.id;

    const isLong = note.testo.length > 200;

    article.innerHTML = `
      <span class="note-timestamp">${formatDateTime(note.createdAt)}</span>
      <div class="note-body">${esc(note.testo)}</div>
      <div class="note-card-footer">
        ${isLong ? `<button class="btn-expand" aria-expanded="false">▼ Espandi</button>` : '<span></span>'}
        <button class="btn-icon btn-icon--delete" data-delete-note="${note.id}" aria-label="Elimina nota">✕</button>
      </div>
    `;

    if (isLong) {
      const expandBtn = article.querySelector('.btn-expand');
      expandBtn.addEventListener('click', () => {
        const collapsed = article.classList.toggle('is-collapsed');
        expandBtn.textContent = collapsed ? '▼ Espandi' : '▲ Comprimi';
        expandBtn.setAttribute('aria-expanded', String(!collapsed));
      });
    }

    stream.appendChild(article);
  });
}

function initNote() {
  const composeForm = $('#note-compose-form');
  const textarea    = $('#note-textarea');

  $('#btn-nuova-nota').addEventListener('click', () => {
    composeForm.hidden = false;
    textarea.focus();
  });

  $('#btn-cancella-nota').addEventListener('click', () => {
    composeForm.hidden = true;
    textarea.value = '';
  });

  composeForm.addEventListener('submit', e => {
    e.preventDefault();
    const testo = textarea.value.trim();
    if (!testo) return;

    state.notes.push({ id: uid(), testo, createdAt: Date.now() });
    textarea.value = '';
    composeForm.hidden = true;
    Sound.save();
    todayStats().notesSaved++;
    persist();
    renderNotes();
    renderStatsWidget();
    showToast('Nota salvata!');
  });

  $('#note-search').addEventListener('input', e => {
    noteSearchQuery = e.target.value.trim();
    renderNotes();
  });

  // Delegazione delete
  $('#note-stream').addEventListener('click', e => {
    const btn = e.target.closest('[data-delete-note]');
    if (!btn) return;
    state.notes = state.notes.filter(n => n.id !== btn.dataset.deleteNote);
    Sound.delete_();
    persist();
    renderNotes();
    showToast('Nota eliminata.');
  });
}

// ================================================================
//  OBIETTIVI / MILESTONE
// ================================================================
function renderMilestones() {
  const list  = $('#milestone-list');
  const empty = $('#milestones-empty');

  $$('.milestone-item', list).forEach(el => el.remove());

  if (state.milestones.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  state.milestones.forEach(m => {
    const pct = m.target > 0 ? Math.min(100, Math.round((m.corrente / m.target) * 100)) : 0;
    const filled = Math.round(pct / 10);
    const ascii  = '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + ']';

    const li = document.createElement('li');
    li.className = 'milestone-item';
    li.dataset.milestoneId = m.id;
    li.innerHTML = `
      <div class="milestone-header">
        <span class="milestone-title">${esc(m.titolo)}</span>
        <span class="milestone-pct">${pct}%</span>
        <div class="milestone-stepper">
          <button class="btn-icon" data-dec-milestone="${m.id}" aria-label="Decrementa">−</button>
          <button class="btn-icon" data-inc-milestone="${m.id}" aria-label="Incrementa">+</button>
        </div>
        <div class="card-actions">
          <button class="btn-icon" data-edit-milestone="${m.id}" aria-label="Modifica">✎</button>
          <button class="btn-icon btn-icon--delete" data-delete-milestone="${m.id}" aria-label="Elimina">✕</button>
        </div>
      </div>
      <div class="progress-bar-ascii">${ascii} ${pct}%</div>
      <div class="progress-bar-native"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <span class="milestone-values">${m.corrente} / ${m.target}${m.unita ? ' ' + esc(m.unita) : ''}</span>
    `;

    list.appendChild(li);
  });
}

function openModalObiettivo(m = null) {
  const modal = $('#modal-obiettivo');
  $('#obiettivo-edit-id').value   = m ? m.id : '';
  $('#obiettivo-titolo').value    = m ? m.titolo : '';
  $('#obiettivo-corrente').value  = m ? m.corrente : 0;
  $('#obiettivo-target').value    = m ? m.target : 100;
  $('#obiettivo-unita').value     = m ? (m.unita || '') : '';
  $('#modal-obiettivo-title').textContent = m ? 'modifica_obiettivo.log' : 'nuovo_obiettivo.log';
  modal.hidden = false;
  $('#obiettivo-titolo').focus();
}

function closeModalObiettivo() { $('#modal-obiettivo').hidden = true; }

function initObiettivi() {
  $('#btn-nuovo-obiettivo').addEventListener('click', () => openModalObiettivo());
  $('#modal-obiettivo-close').addEventListener('click', closeModalObiettivo);
  $('#modal-obiettivo-annulla').addEventListener('click', closeModalObiettivo);
  $('#modal-obiettivo').addEventListener('click', e => { if (e.target === e.currentTarget) closeModalObiettivo(); });

  $('#milestone-list').addEventListener('click', e => {
    const editBtn   = e.target.closest('[data-edit-milestone]');
    const deleteBtn = e.target.closest('[data-delete-milestone]');
    const incBtn    = e.target.closest('[data-inc-milestone]');
    const decBtn    = e.target.closest('[data-dec-milestone]');

    if (editBtn) {
      const m = state.milestones.find(m => m.id === editBtn.dataset.editMilestone);
      if (m) openModalObiettivo(m);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.deleteMilestone;
      if (confirm('Eliminare questo obiettivo?')) {
        state.milestones = state.milestones.filter(m => m.id !== id);
        Sound.delete_();
        persist();
        renderMilestones();
        showToast('Obiettivo eliminato.');
      }
    }

    if (incBtn) {
      const m = state.milestones.find(m => m.id === incBtn.dataset.incMilestone);
      if (m) { m.corrente = Math.min(m.target, m.corrente + 1); Sound.click(); persist(); renderMilestones(); }
    }
    if (decBtn) {
      const m = state.milestones.find(m => m.id === decBtn.dataset.decMilestone);
      if (m) { m.corrente = Math.max(0, m.corrente - 1); Sound.click(); persist(); renderMilestones(); }
    }
  });

  $('#form-obiettivo').addEventListener('submit', e => {
    e.preventDefault();
    const titolo = $('#obiettivo-titolo').value.trim();
    if (!titolo) return;

    const editId = $('#obiettivo-edit-id').value;
    const data = {
      titolo,
      corrente: Number($('#obiettivo-corrente').value) || 0,
      target:   Number($('#obiettivo-target').value)   || 100,
      unita:    $('#obiettivo-unita').value.trim(),
    };

    Sound.save();
    if (editId) {
      const idx = state.milestones.findIndex(m => m.id === editId);
      if (idx !== -1) state.milestones[idx] = { ...state.milestones[idx], ...data };
      showToast('Obiettivo aggiornato.');
    } else {
      state.milestones.push({ id: uid(), createdAt: Date.now(), ...data });
      showToast('Obiettivo creato!');
    }

    persist();
    closeModalObiettivo();
    renderMilestones();
  });
}

// ================================================================
//  ABITUDINI
// ================================================================
function computeStreak(habit) {
  const tk = todayKey();
  let streak = habit.checks && habit.checks[tk] ? 1 : 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!habit.checks || !habit.checks[k]) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderAbitudini() {
  const list  = $('#habit-list');
  const empty = $('#habits-empty');
  if (!list) return;
  $$('.habit-item', list).forEach(el => el.remove());
  const tk = todayKey();
  const total   = state.habits.length;
  const checked = state.habits.filter(h => h.checks && h.checks[tk]).length;
  const countEl = $('#habit-today-count');
  const fillEl  = $('#habit-day-fill');
  if (countEl) countEl.textContent = `${checked} / ${total}`;
  if (fillEl)  fillEl.style.width  = total > 0 ? `${Math.round((checked/total)*100)}%` : '0%';
  if (total === 0) { empty.hidden = false; return; }
  empty.hidden = true;
  state.habits.forEach(h => {
    if (!h.checks) h.checks = {};
    const streak = computeStreak(h);
    const isDone = !!h.checks[tk];
    const li = document.createElement('li');
    li.className = `habit-item${isDone ? ' is-checked' : ''}`;
    li.dataset.habitId = h.id;
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" id="hc-${h.id}" ${isDone ? 'checked' : ''} aria-label="${esc(h.nome)}" />
      <label class="habit-nome" for="hc-${h.id}">${esc(h.nome)}</label>
      <span class="habit-streak">${streak > 0 ? `🔥 ${streak}` : '—'}</span>
      <div class="card-actions">
        <button class="btn-icon btn-icon--delete" data-delete-habit="${h.id}" aria-label="Elimina abitudine">✕</button>
      </div>
    `;
    li.querySelector('.task-checkbox').addEventListener('change', () => {
      if (!h.checks) h.checks = {};
      if (h.checks[tk]) { delete h.checks[tk]; } else { h.checks[tk] = true; Sound.complete(); }
      persist();
      renderAbitudini();
    });
    list.appendChild(li);
  });
}

function initAbitudini() {
  const addBtn    = $('#btn-nuova-abitudine');
  const form      = $('#habit-add-form');
  const cancelBtn = $('#btn-cancella-abitudine');
  const input     = $('#habit-input');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => { form.hidden = !form.hidden; if (!form.hidden) input.focus(); });
  cancelBtn.addEventListener('click', () => { form.hidden = true; input.value = ''; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = input.value.trim();
    if (!nome) return;
    state.habits.push({ id: uid(), nome, checks: {} });
    input.value = ''; form.hidden = true;
    Sound.save(); persist(); renderAbitudini(); showToast('Abitudine aggiunta!');
  });
  $('#habit-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-delete-habit]');
    if (!btn) return;
    state.habits = state.habits.filter(h => h.id !== btn.dataset.deleteHabit);
    Sound.delete_(); persist(); renderAbitudini(); showToast('Abitudine eliminata.');
  });
}

// ================================================================
//  QUICK CAPTURE
// ================================================================
const QuickCapture = (() => {
  let activeTab = 'task';
  function open() {
    const modal = $('#modal-quick-capture');
    if (!modal) return;
    const sel = $('#qc-task-project');
    sel.innerHTML = '<option value="">— Progetto —</option>';
    state.projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id; opt.textContent = p.titolo;
      if (p.id === selectedProjectId) opt.selected = true;
      sel.appendChild(opt);
    });
    modal.hidden = false;
    setTimeout(() => {
      const inp = activeTab === 'task' ? $('#qc-task-input') : $('#qc-nota-input');
      if (inp) inp.focus();
    }, 50);
  }
  function close() {
    const modal = $('#modal-quick-capture');
    if (!modal) return;
    modal.hidden = true;
    const ti = $('#qc-task-input'); if (ti) ti.value = '';
    const ni = $('#qc-nota-input'); if (ni) ni.value = '';
  }
  function switchTab(tab) {
    activeTab = tab;
    $$('.qc-tab').forEach(b => {
      const a = b.id === `qc-tab-${tab}`;
      b.classList.toggle('active', a);
      b.setAttribute('aria-selected', String(a));
    });
    $$('.qc-panel').forEach(p => { p.hidden = p.id !== `qc-panel-${tab}`; });
    setTimeout(() => {
      const inp = tab === 'task' ? $('#qc-task-input') : $('#qc-nota-input');
      if (inp) inp.focus();
    }, 20);
  }
  function save() {
    if (activeTab === 'task') {
      const testo = $('#qc-task-input').value.trim();
      if (!testo) return;
      const tipo = $('#qc-task-priority').value;
      if (tipo === 'focus' && state.tasks.filter(t => t.tipo === 'focus' && !t.done).length >= 3) {
        Sound.warn(); showToast('Max 3 task in Focus Odierno.'); return;
      }
      state.tasks.push({ id: uid(), testo, tipo, done: false,
        projectId: $('#qc-task-project').value || null,
        dueDate: null, createdAt: Date.now(), completedAt: null });
      persist(); renderTasks(); Sound.save(); showToast('Task aggiunto!');
    } else {
      const testo = $('#qc-nota-input').value.trim();
      if (!testo) return;
      state.notes.push({ id: uid(), testo, createdAt: Date.now() });
      todayStats().notesSaved++;
      persist(); renderNotes(); renderStatsWidget(); Sound.save(); showToast('Nota salvata!');
    }
    close();
  }
  function init() {
    $('#qc-close').addEventListener('click', close);
    $('#modal-quick-capture').addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
    $$('.qc-tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.id.replace('qc-tab-', ''))));
    $('#qc-save').addEventListener('click', save);
    ['#qc-task-input', '#qc-nota-input'].forEach(sel => {
      const el = $(sel); if (!el) return;
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
        if (e.key === 'Escape') close();
      });
    });
  }
  return { open, close, init };
})();

// ================================================================
//  DESKTOP WIDGETS
// ================================================================
const QUOTES = [
  '"Costruisci lentamente, costruisci bene."',
  '"Un task alla volta. Sempre."',
  '"La chiarezza prima della velocità."',
  '"Ogni giorno un mattone."',
  '"Scrivi. Rifletti. Costruisci."',
  '"Il focus è il tuo superpotere."',
  '"Meno rumore, più lavoro."',
  '"Un progetto alla volta. Fallo bene."',
  '"La calma è la base di tutto."',
  '"Oggi — cosa conta davvero?"',
  '"Lento è fluido. Fluido è veloce."',
  '"Prima pensa. Poi agisci."',
  '"Le buone abitudini costruiscono grandi risultati."',
  '"Inizia. Il resto viene da sé."',
  '"Piccoli passi, grandi distanze."',
  '"Qualità sempre, fretta mai."',
  '"Rifletti ogni sera. Pianifica ogni mattina."',
  '"Il tuo lavoro parla per te."',
];

function renderQuoteWidget() {
  const el = $('#widget-quote-text');
  if (!el) return;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  el.textContent = QUOTES[dayOfYear % QUOTES.length];
}

function renderStatsWidget() {
  const s = todayStats();
  const tv = $('#stat-tasks-val');    if (tv) tv.textContent = s.tasksDone;
  const nv = $('#stat-notes-val');    if (nv) nv.textContent = s.notesSaved;
  const pv = $('#stat-pomodoro-val'); if (pv) pv.textContent = s.pomodoroSessions;
}

// ================================================================
//  KEYBOARD SHORTCUTS
// ================================================================
const WIN_KEY_MAP = { '1':'progetti','2':'task','3':'note','4':'obiettivi','5':'timer','6':'abitudini' };

function handleEscape() {
  if (!$('#modal-quick-capture').hidden) { QuickCapture.close(); return; }
  if (!$('#overlay-help').hidden)        { closeHelp(); return; }
  if (!$('#modal-progetto').hidden)      { closeModalProgetto(); return; }
  if (!$('#modal-obiettivo').hidden)     { closeModalObiettivo(); return; }
  const open = $$('.os-window').filter(w => !w.hidden && !w.classList.contains('is-minimized'));
  if (!open.length) return;
  const top = open.reduce((a,b) => (parseInt(a.style.zIndex)||0) > (parseInt(b.style.zIndex)||0) ? a : b);
  WM.close(top.dataset.windowId);
}

function openHelp()  { $('#overlay-help').hidden = false; Sound.click(); }
function closeHelp() { $('#overlay-help').hidden = true; }

function initKeyboardShortcuts() {
  $('#help-close').addEventListener('click', closeHelp);
  $('#overlay-help').addEventListener('click', e => { if (e.target === e.currentTarget) closeHelp(); });
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = ['input','textarea','select'].includes(tag);
    if (e.key === 'Escape') { handleEscape(); return; }
    if (isTyping) return;
    if (e.key === '?') { openHelp(); return; }
    if (e.key.toLowerCase() === 'q') { QuickCapture.open(); Sound.click(); return; }
    const winId = WIN_KEY_MAP[e.key];
    if (winId) WM.open(winId);
  });
}

// ================================================================
//  TIMER POMODORO (Mangiadischi)
// ================================================================
let timerLinkedTaskId = null;

const Timer = (() => {
  const WORK  = 25 * 60;
  const BREAK = 5  * 60;

  let remaining   = WORK;
  let isRunning   = false;
  let isBreak     = false;
  let session     = 1;
  let cycles      = 0;
  let _interval   = null;

  function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }

  function renderTimerFocusLabel() {
    const el = $('#timer-focus-task');
    if (!el) return;
    if (timerLinkedTaskId) {
      const t = state.tasks.find(t => t.id === timerLinkedTaskId && !t.done);
      if (t) { el.textContent = `focus: ${t.testo}`; el.hidden = false; return; }
    }
    el.hidden = true;
  }

  function render() {
    $('#timer-time').textContent  = fmt(remaining);
    $('#timer-mode').textContent  = isBreak ? 'PAUSA' : 'LAVORO';
    $('#timer-session').textContent = `Sessione #${session}`;

    $$('.cycle-dot').forEach((dot, i) => {
      dot.classList.toggle('is-done', i < (cycles % 4));
    });

    const cassette = $('#cassette-body');
    if (cassette) cassette.classList.toggle('is-playing', isRunning);

    $('#btn-timer-start').disabled = isRunning;
    $('#btn-timer-pause').disabled = !isRunning;

    renderTimerFocusLabel();
  }

  function complete() {
    isRunning = false;
    clearInterval(_interval);

    if (!isBreak) {
      cycles++;
      isBreak = true;
      remaining = BREAK;
      todayStats().pomodoroSessions++;
      persist();
      renderStatsWidget();
      showToast('⏱ Sessione completata! Prenditi una pausa.');
      $('#timer-display').classList.add('is-complete');
      setTimeout(() => $('#timer-display').classList.remove('is-complete'), 2000);
    } else {
      isBreak = false;
      session++;
      remaining = WORK;
      showToast('▶ Pausa finita! Pronti per il prossimo focus.');
    }

    render();
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    _interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) complete();
      else render();
    }, 1000);
    render();
  }

  function pause() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(_interval);
    render();
  }

  function reset() {
    isRunning = false;
    isBreak   = false;
    remaining = WORK;
    clearInterval(_interval);
    render();
  }

  function init() {
    $('#btn-timer-start').addEventListener('click', start);
    $('#btn-timer-pause').addEventListener('click', pause);
    $('#btn-timer-reset').addEventListener('click', reset);
    render();
  }

  return {
    init,
    linkTask(id) {
      timerLinkedTaskId = (id === timerLinkedTaskId) ? null : id;
      renderTimerFocusLabel();
      renderTasks();
    }
  };
})();

// ================================================================
//  HELPERS
// ================================================================
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function formatDateTime(ts) {
  const d = new Date(ts);
  const pad = v => String(v).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ================================================================
//  INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  WM.initAll();
  initVibe();
  initProgetti();
  initTask();
  initNote();
  initObiettivi();
  Timer.init();
  initAbitudini();
  QuickCapture.init();
  initKeyboardShortcuts();

  renderProjects();
  renderTasks();
  renderNotes();
  renderMilestones();
  renderAbitudini();
  renderQuoteWidget();
  renderStatsWidget();

  // Click generico su elementi interattivi non già coperti da suoni specifici
  document.addEventListener('click', e => {
    const target = e.target;
    const isBtn     = target.closest('button, .desktop-icon, .filter-btn, .taskbar-btn');
    const isSpecial = target.closest(
      '[data-action], [data-delete-task], [data-delete-note], ' +
      '[data-delete-project], [data-delete-milestone], ' +
      '[data-edit-project], [data-edit-milestone], ' +
      '.task-checkbox, #btn-timer-start, #btn-timer-pause, #btn-timer-reset, ' +
      '.desktop-icon, [data-filter]'
    );

    // Suona il click morbido solo su elementi interattivi non già coperti da suoni dedicati
    if (isBtn && !isSpecial) Sound.click();
  }, { capture: false });

  // Checkbox check → handled in toggleTask; filter/icon → handle here
  document.addEventListener('click', e => {
    if (e.target.closest('[data-filter]') || e.target.closest('.taskbar-btn')) Sound.click();
  });
});
