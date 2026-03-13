document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  try{
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if(!res.ok){ errEl.textContent = data.error || (data.errors && data.errors.map(x=>x.msg).join(', ')) || 'Error'; errEl.style.display = 'block'; return; }
    // save token and user
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    // redirect to main app
    window.location = '/';
  } catch(err){ errEl.textContent = 'Error de conexión'; errEl.style.display = 'block'; }
});
