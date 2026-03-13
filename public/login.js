function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  let particles = [];
  const maxParticles = 80;

  function createParticle() {
    const size = 1 + Math.random() * 2;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size,
      alpha: 0.15 + Math.random() * 0.3
    };
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    if (particles.length < maxParticles) particles.push(createParticle());

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    });

    requestAnimationFrame(update);
  }

  window.addEventListener('resize', () => {
    resize();
  });

  resize();
  update();
}

initParticles('particles-canvas');

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
