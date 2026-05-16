/* ================================================================
   RetroHQ — auth.js
   Login guard con verifica SHA-256 lato client.
   Le credenziali non sono mai salvate in chiaro nel codice.
================================================================ */

(async () => {
  // Hash SHA-256 precalcolati — le credenziali originali non compaiono mai
  const H_USER = '63a32454781c401ed149d5df11f303b57696b730d657e165923d1d5568b9469e';
  const H_PASS = 'aca6c2935fe1d9f3312d25a99e11f6340878a727f46c4837ba18ea01e8453a60';

  async function sha256(str) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Sessione già autenticata?
  if (sessionStorage.getItem('rethq_auth') === '1') {
    document.getElementById('login-screen').remove();
    return;
  }

  // Mostra il login e blocca il desktop
  const screen = document.getElementById('login-screen');
  const osRoot = document.getElementById('os-root');
  screen.hidden = false;
  osRoot.style.display = 'none';

  const form    = document.getElementById('login-form');
  const errEl   = document.getElementById('login-error');
  const userInp = document.getElementById('login-username');
  const passInp = document.getElementById('login-password');
  const btn     = document.getElementById('login-btn');

  let attempts = 0;
  let locked   = false;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (locked) return;

    btn.disabled  = true;
    btn.textContent = 'Verifica...';
    errEl.hidden  = true;

    const [hu, hp] = await Promise.all([
      sha256(userInp.value),
      sha256(passInp.value),
    ]);

    if (hu === H_USER && hp === H_PASS) {
      sessionStorage.setItem('rethq_auth', '1');
      screen.classList.add('auth-exit');
      setTimeout(() => {
        screen.remove();
        osRoot.style.display = '';
      }, 500);
    } else {
      attempts++;
      passInp.value = '';
      errEl.hidden  = false;
      screen.classList.add('auth-shake');
      setTimeout(() => screen.classList.remove('auth-shake'), 400);

      // Dopo 5 tentativi sbagliati: lockout 30 secondi
      if (attempts >= 5) {
        locked = true;
        let secs = 30;
        errEl.textContent = `Troppi tentativi. Riprova tra ${secs}s.`;
        const t = setInterval(() => {
          secs--;
          errEl.textContent = `Troppi tentativi. Riprova tra ${secs}s.`;
          if (secs <= 0) {
            clearInterval(t);
            locked   = false;
            attempts = 0;
            errEl.textContent = 'Credenziali non valide.';
            btn.disabled = false;
            btn.textContent = 'Entra →';
            userInp.focus();
          }
        }, 1000);
        return;
      }

      btn.disabled    = false;
      btn.textContent = 'Entra →';
      passInp.focus();
    }
  });

  userInp.focus();
})();
