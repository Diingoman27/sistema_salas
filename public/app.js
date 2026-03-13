const api = '/api';

let currentUser = null;
let authToken = null;
let clients = [];
let workers = [];
let rooms = [];
let reservations = [];

function el(id){return document.getElementById(id)}

function navigateToLogin(){ window.location = '/login.html'; }

function setAuth(token, user){
  authToken = token;
  currentUser = user;
  if(token){ localStorage.setItem('authToken', token); localStorage.setItem('authUser', JSON.stringify(user)); }
  else { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); }
  updateAuthUI();
}

function loadAuthFromStorage(){
  const t = localStorage.getItem('authToken');
  const u = localStorage.getItem('authUser');
  if(t && u){ authToken = t; currentUser = JSON.parse(u); }
  updateAuthUI();
}

function updateAuthUI(){
  if(currentUser){ el('user-info').textContent = `${currentUser.name} (${currentUser.role})`; el('btn-login').style.display='none'; el('btn-logout').style.display='inline-block'; }
  else { el('user-info').textContent=''; el('btn-login').style.display='inline-block'; el('btn-logout').style.display='none'; }
  // control visibility of forms based on role
  const isAdmin = currentUser && currentUser.role==='admin';
  const isWorker = currentUser && currentUser.role==='worker';
  document.querySelectorAll('form').forEach(f => {
    // client-form, worker-form, room-form only for admin
    if(f.id==='client-form' || f.id==='worker-form' || f.id==='room-form') f.style.display = isAdmin ? 'flex' : 'none';
    // res-form only for worker or admin
    if(f.id==='res-form') f.style.display = (isWorker || isAdmin) ? 'grid' : 'none';
  });
  // Hide workers tab if not admin
  const workersTab = document.querySelector('button[data-view="workers"]');
  if(workersTab) workersTab.style.display = isAdmin ? 'inline-block' : 'none';
}

function authHeaders(){ return authToken ? { 'Authorization': 'Bearer ' + authToken } : {}; }

async function login(){
  // legacy: login handled on separate page
  return;
}

function logout(){ setAuth(null, null); loadAll(); }


async function createClient(){
  const body = { name: el('client-name').value.trim(), email: el('client-email').value.trim(), department: el('client-dept').value.trim(), password: el('client-password').value };
  if(!body.name || !body.email || !body.password) return alert('Nombre, correo y contraseña requeridos');
  const r = await fetch(api + '/clients', { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify(body)});
  const data = await r.json();
  if(r.ok) { 
    el('client-form').reset(); 
    showConfirmation(`<strong>Cliente creado:</strong><br>Nombre: ${data.name}<br>Email: ${data.email}<br>Departamento: ${data.department || 'N/A'}`);
    loadAll(); 
  } else alert(data.error || 'Error');
}

async function createWorker(){
  const body = { name: el('worker-name').value.trim(), email: el('worker-email').value.trim(), password: el('worker-password').value };
  if(!body.name || !body.email || !body.password) return alert('Nombre, correo y contraseña requeridos');
  const r = await fetch(api + '/users', { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify(body)});
  const data = await r.json();
  if(r.ok) { 
    el('worker-form').reset(); 
    showConfirmation(`<strong>Trabajador creado:</strong><br>Nombre: ${data.name}<br>Email: ${data.email}<br>Rol: ${data.role}`);
    loadAll(); 
  } else alert(data.error || 'Error');
}

async function createRoom(){
  const body = { name: el('room-name').value.trim(), capacity: +el('room-capacity').value || 1, resources: el('room-res').value.trim() };
  if(!body.name) return alert('Nombre de sala requerido');
  const r = await fetch(api + '/rooms', { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify(body)});
  const data = await r.json();
  if(r.ok) { 
    el('room-form').reset(); 
    showConfirmation(`<strong>Sala creada:</strong><br>Nombre: ${data.name}<br>Capacidad: ${data.capacity}<br>Recursos: ${data.resources || 'N/A'}`);
    loadAll(); 
  } else alert(data.error || 'Error');
}

async function createReservation(){
  const body = { roomId:+el('res-room').value, clientId:+el('res-client').value, startTime: new Date(el('res-start').value).toISOString(), endTime: new Date(el('res-end').value).toISOString(), purpose: el('res-purpose').value };
  if(!body.roomId || !body.clientId) return alert('Seleccione sala y cliente');
  const r = await fetch(api + '/reservations', { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify(body)});
  const data = await r.json();
  if(r.ok) { 
    el('res-form').reset(); 
    const roomName = data.Room ? data.Room.name : data.roomId;
    const clientName = data.Client ? data.Client.name : data.clientId;
    showConfirmation(`<strong>Reserva creada:</strong><br>Sala: ${roomName}<br>Cliente: ${clientName}<br>Inicio: ${formatDate(data.startTime)}<br>Fin: ${formatDate(data.endTime)}<br>Propósito: ${data.purpose || 'N/A'}`);
    loadAll(); 
  } else alert(data.error || 'Error: ' + (data.error || JSON.stringify(data)));
}

async function deleteItem(path, id){
  if(!confirm('Confirmar eliminación')) return;
  await fetch(`${api}/${path}/${id}`, { method:'DELETE', headers: authHeaders() });
  loadAll();
}

function formatDate(d){ if(!d) return ''; const dt = new Date(d); return dt.toLocaleString(); }

async function computeRoomStats(rooms, reservations){
  const now = new Date();
  const in30 = new Date(); in30.setDate(now.getDate() + 30);
  return rooms.map(room => {
    const rs = reservations.filter(r => r.roomId === room.id);
    // occupied now?
    const current = rs.find(r => new Date(r.startTime) <= now && new Date(r.endTime) > now);
    // next free or next reservation
    let status = 'Disponible';
    let until = null;
    if(current){ status = `Ocupada hasta ${formatDate(current.endTime)}`; until = current.endTime; }
    else {
      // check next reservation
      const future = rs.filter(r => new Date(r.startTime) > now).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];
      if(future) status = `Reservada desde ${formatDate(future.startTime)}`;
    }

    // days occupied in next 30 days (approx by summing day spans intersecting window)
    let daysOccupied = 0;
    rs.forEach(r => {
      const s = new Date(r.startTime); const e = new Date(r.endTime);
      const start = s < now ? now : s;
      const end = e > in30 ? in30 : e;
      if(end > start){ daysOccupied += Math.ceil((end - start) / (1000*60*60*24)); }
    });

    return { room, status, daysOccupied };
  });
}

async function loadAll(){
  [clients, rooms, reservations] = await Promise.all([
    fetch(api + '/clients', { headers: authHeaders() }).then(r=>r.json()),
    fetch(api + '/rooms', { headers: authHeaders() }).then(r=>r.json()),
    fetch(api + '/reservations', { headers: authHeaders() }).then(r=>r.json())
  ]);
  if(currentUser && currentUser.role === 'admin'){
    workers = await fetch(api + '/users', { headers: authHeaders() }).then(r=>r.json());
  } else {
    workers = [];
  }

  // CLIENTS view: list clients and their upcoming reservations
  const ct = el('clients-table').querySelector('tbody'); ct.innerHTML = '';
  clients.forEach(c=>{
    const userRes = reservations.filter(r => r.clientId === c.id && new Date(r.endTime) > new Date()).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));
    const upcoming = userRes.map(r => `${r.roomId} (${formatDate(r.startTime)}→${formatDate(r.endTime)})`).join('<br>') || '<span class="small">Sin reservas</span>';
    const isAdmin = currentUser && currentUser.role === 'admin';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.id}</td><td>${c.name}</td><td>${c.email}</td><td>${c.department||''}</td><td>${upcoming}</td><td>${isAdmin ? `<button class="btn" onclick="editClient(${c.id})"><i class="fas fa-edit"></i> Editar</button> <button class="btn danger" onclick="deleteItem('clients', ${c.id})"><i class="fas fa-trash"></i> Eliminar</button>` : ''}</td>`;
    ct.appendChild(tr);
  });

  // WORKERS view: list workers
  const wt = el('workers-table').querySelector('tbody'); wt.innerHTML = '';
  workers.forEach(w=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${w.id}</td><td>${w.name}</td><td>${w.email}</td><td>${w.role}</td><td><button class="btn" onclick="editWorker(${w.id})"><i class="fas fa-edit"></i> Editar</button> <button class="btn danger" onclick="deleteItem('users', ${w.id})"><i class="fas fa-trash"></i> Eliminar</button></td>`;
    wt.appendChild(tr);
  });

  // ROOMS view: show status and days occupied
  const stats = await computeRoomStats(rooms, reservations);
  const rt = el('rooms-table').querySelector('tbody'); rt.innerHTML = '';
  stats.forEach(s => {
    const tr = document.createElement('tr');
    const canDelete = currentUser && currentUser.role==='admin';
    const canEdit = currentUser && currentUser.role==='admin';
    tr.innerHTML = `<td>${s.room.id}</td><td>${s.room.name}</td><td>${s.room.capacity}</td><td>${s.status}</td><td>${s.daysOccupied}</td><td>${canEdit ? `<button class="btn" onclick="editRoom(${s.room.id})"><i class="fas fa-edit"></i> Editar</button>` : ''} ${canDelete?`<button class="btn" onclick="deleteItem('rooms',${s.room.id})"><i class="fas fa-trash"></i> Eliminar</button>`:''}</td>`;
    rt.appendChild(tr);
  });

  // RESERVATIONS view: show detailed reservations
  const rest = el('reservations-table').querySelector('tbody'); rest.innerHTML = '';
  reservations.forEach(r=>{
    const roomName = r.Room && r.Room.name ? r.Room.name : r.roomId;
    const clientName = r.Client && r.Client.name ? r.Client.name : r.clientId;
    const isAdmin = currentUser && currentUser.role === 'admin';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${roomName}</td><td>${clientName}</td><td>${formatDate(r.startTime)}</td><td>${formatDate(r.endTime)}</td><td>${r.purpose||''}</td><td>${isAdmin ? `<button class="btn" onclick="editReservation(${r.id})"><i class="fas fa-edit"></i> Editar</button> <button class="btn danger" onclick="deleteItem('reservations', ${r.id})"><i class="fas fa-trash"></i> Eliminar</button>` : ''}</td>`;
    rest.appendChild(tr);
  });

  // populate selects for reservations form
  const resRoom = el('res-room'); const resClient = el('res-client');
  resRoom.innerHTML = '<option value="">Seleccione sala</option>' + rooms.map(r=>`<option value="${r.id}">${r.name} (${r.capacity})</option>`).join('');
  resClient.innerHTML = '<option value="">Seleccione cliente</option>' + clients.map(c=>`<option value="${c.id}">${c.name} - ${c.email}</option>`).join('');
}

function openModal(modalId) {
  el(modalId).style.display = 'block';
}

function closeModal(modalId) {
  el(modalId).style.display = 'none';
}

function showConfirmation(content) {
  el('confirmation-content').innerHTML = content;
  openModal('confirmation-modal');
}

// Editar cliente
function editClient(id) {
  const client = clients.find(c => c.id == id);
  if (!client) return;
  el('edit-client-id').value = client.id;
  el('edit-client-name').value = client.name;
  el('edit-client-email').value = client.email;
  el('edit-client-dept').value = client.department || '';
  openModal('edit-client-modal');
}

async function updateClient() {
  const id = el('edit-client-id').value;
  const body = {
    name: el('edit-client-name').value.trim(),
    email: el('edit-client-email').value.trim(),
    department: el('edit-client-dept').value.trim()
  };
  try {
    const res = await fetch(`${api}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('edit-client-modal');
      loadAll();
    } else {
      alert('Error al actualizar cliente');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

function editWorker(id) {
  const worker = workers.find(w => w.id == id);
  if (!worker) return;
  el('edit-worker-id').value = worker.id;
  el('edit-worker-name').value = worker.name;
  el('edit-worker-email').value = worker.email;
  openModal('edit-worker-modal');
}

async function updateWorker() {
  const id = el('edit-worker-id').value;
  const body = {
    name: el('edit-worker-name').value.trim(),
    email: el('edit-worker-email').value.trim()
  };
  try {
    const res = await fetch(`${api}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('edit-worker-modal');
      loadAll();
    } else {
      alert('Error al actualizar trabajador');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// Editar sala
function editRoom(id) {
  const room = rooms.find(r => r.id == id);
  if (!room) return;
  el('edit-room-id').value = room.id;
  el('edit-room-name').value = room.name;
  el('edit-room-capacity').value = room.capacity;
  el('edit-room-res').value = room.resources || '';
  openModal('edit-room-modal');
}

async function updateRoom() {
  const id = el('edit-room-id').value;
  const body = {
    name: el('edit-room-name').value.trim(),
    capacity: parseInt(el('edit-room-capacity').value),
    resources: el('edit-room-res').value.trim()
  };
  try {
    const res = await fetch(`${api}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('edit-room-modal');
      loadAll();
    } else {
      alert('Error al actualizar sala');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// Editar reserva
function editReservation(id) {
  const res = reservations.find(r => r.id == id);
  if (!res) return;
  el('edit-reservation-id').value = res.id;
  el('edit-res-room').value = res.roomId;
  el('edit-res-client').value = res.clientId;
  el('edit-res-start').value = formatDateTimeLocal(res.startTime);
  el('edit-res-end').value = formatDateTimeLocal(res.endTime);
  el('edit-res-purpose').value = res.purpose || '';
  // Populate selects
  const editResRoom = el('edit-res-room');
  const editResClient = el('edit-res-client');
  editResRoom.innerHTML = '<option value="">Seleccione sala</option>' + rooms.map(r=>`<option value="${r.id}">${r.name} (${r.capacity})</option>`).join('');
  editResClient.innerHTML = '<option value="">Seleccione cliente</option>' + clients.map(c=>`<option value="${c.id}">${c.name} - ${c.email}</option>`).join('');
  openModal('edit-reservation-modal');
}

async function updateReservation() {
  const id = el('edit-reservation-id').value;
  const body = {
    roomId: parseInt(el('edit-res-room').value),
    clientId: parseInt(el('edit-res-client').value),
    startTime: el('edit-res-start').value,
    endTime: el('edit-res-end').value,
    purpose: el('edit-res-purpose').value.trim()
  };
  try {
    const res = await fetch(`${api}/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('edit-reservation-modal');
      loadAll();
    } else {
      const data = await res.json();
      alert('Error: ' + (data.error || 'Error al actualizar reserva'));
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

function formatDateTimeLocal(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}

window.createClient = createClient;
window.createRoom = createRoom;
window.createReservation = createReservation;
window.deleteItem = deleteItem;
window.editClient = editClient;
window.editRoom = editRoom;
window.editReservation = editReservation;
window.updateClient = updateClient;
window.updateRoom = updateRoom;
window.updateReservation = updateReservation;
window.closeModal = closeModal;

function showView(view){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===view));
  document.querySelectorAll('.view').forEach(v=>v.style.display = (v.id === 'view-'+view) ? 'block' : 'none');
}

// start
loadAuthFromStorage();
showView('clients');
loadAll();

// expose
window.showView = showView;
