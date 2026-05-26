/*
========================================================================
   BG CARIBE — ADMIN PANEL JAVASCRIPT
   Lógica completa del panel de administración
   Supabase · Tiempo real · CRUD de reservaciones · Tonos Claros
========================================================================
*/

/* ══════════════════════════════════════════════════════════════════════
   1.  CONSTANTS & CONFIG
   ══════════════════════════════════════════════════════════════════════ */
const ADMIN_PASSWORD = '00000';

const HOTEL_OPTIONS = {
  'Riviera Maya': [
    'Hotel Xcaret México',
    'Hotel Xcaret Arte',
    'Iberostar Paraíso',
    'Grand Palladium',
    'RIU Palace',
    'Barceló Maya',
    'Otro'
  ],
  'Cancún': [
    'Hyatt Ziva',
    'Moon Palace',
    'Le Blanc Spa',
    'Secrets The Vine',
    'Hard Rock Hotel',
    'RIU Cancún',
    'Otro'
  ],
  'Hoteles Xcaret': [
    'Hotel Xcaret México',
    'Hotel Xcaret Arte',
    'La Casa de la Playa'
  ],
  'Nickelodeon Hotels': [
    'Nickelodeon Riviera Maya'
  ]
};

// Mapeo detallado de tipos de habitaciones reales por hotel
const ROOM_OPTIONS = {
  // Hoteles Xcaret
  'Hotel Xcaret México': [
    'Suite Garden',
    'Suite River',
    'Suite Ocean View',
    'Suite Ocean Front',
    'Swim Up Garden',
    'Swim Up Ocean View',
    'Master Suite'
  ],
  'Hotel Xcaret Arte': [
    'Suite Garden (Casa Diseño/Arte)',
    'Suite River',
    'Suite Ocean View',
    'Suite Ocean Front',
    'Swim Up Garden',
    'Junior Suite (Casa Artistas)',
    'Master Suite'
  ],
  'La Casa de la Playa': [
    'Suite Ocean View',
    'Suite Beach Front',
    'Suite Ocean Front',
    'Presidential Suite'
  ],
  // Nickelodeon
  'Nickelodeon Riviera Maya': [
    'Pad Suite Swim-Up',
    'Flat Suite Swim-Up',
    'Swank Swim-Up Suite',
    'Swank Plunge Pool Suite',
    'Lair Suite (Ninja Turtles)',
    'Pineapple Villa (SpongeBob)'
  ],
  // Cancún
  'Hyatt Ziva': [
    'King Room Standard',
    'Double Room Standard',
    'Resort View',
    'Ocean View',
    'Club Ocean Front',
    'Dolphin View',
    'Swim Up Room'
  ],
  'Moon Palace': [
    'Deluxe Resort View',
    'Deluxe Ocean View',
    'Superior Deluxe',
    'Family Deluxe (2 recámaras)',
    'Governor Suite',
    'Presidential Suite'
  ],
  'Le Blanc Spa': [
    'Royale Deluxe Resort View',
    'Royale Honeymoon Suite',
    'Royale Junior Suite',
    'Royale Governor Suite'
  ],
  'Secrets The Vine': [
    'Deluxe Ocean View',
    'Junior Suite Ocean View',
    'Preferred Club Deluxe',
    'Honeymoon Suite',
    'Governor Suite'
  ],
  'Hard Rock Hotel': [
    'Deluxe Gold',
    'Deluxe Platinum',
    'Rock Royalty Room',
    'Rock Suite Gold',
    'Rock Suite Platinum'
  ],
  'RIU Cancún': [
    'Standard Room',
    'Junior Suite Vista Mar',
    'Suite Vista Mar',
    'Presidential Suite'
  ],
  // Riviera Maya
  'Iberostar Paraíso': [
    'Standard Room',
    'Superior Room',
    'Junior Suite',
    'Family Suite',
    'Presidential Suite'
  ],
  'Grand Palladium': [
    'Standard Deluxe',
    'Junior Suite',
    'Amber Suite',
    'Villa Suite'
  ],
  'RIU Palace': [
    'Junior Suite',
    'Suite Vista Mar',
    'Jacuzzi Suite'
  ],
  'Barceló Maya': [
    'Superior Room',
    'Junior Suite Pool View',
    'Family Room',
    'Premium Suite'
  ],
  'Otro': [
    'Estándar',
    'Superior',
    'Deluxe',
    'Junior Suite',
    'Suite',
    'Suite Premium',
    'Villa'
  ]
};

const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const MESES_ES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/* ══════════════════════════════════════════════════════════════════════
   2.  STATE
   ══════════════════════════════════════════════════════════════════════ */
let allReservations = [];
let deleteTargetId = null;
let deleteTargetCode = null;
let realtimeChannel = null;

// Estado del calendario widget
let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth();
let selectedFilterDate = null; // Ej: "2026-05-26"

/* ══════════════════════════════════════════════════════════════════════
   3.  DOM REFERENCES
   ══════════════════════════════════════════════════════════════════════ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══════════════════════════════════════════════════════════════════════
   4.  INITIALIZATION
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si ya está autenticado
  if (sessionStorage.getItem('bgAdmin') === 'true') {
    showDashboard();
  }

  initLoginForm();
  initSidebar();
  initReservationForm();
  initFilters();
  initEditFormListeners();
  initCalendarListeners();
});

/* ══════════════════════════════════════════════════════════════════════
   5.  LOGIN
   ══════════════════════════════════════════════════════════════════════ */
function initLoginForm() {
  const form = $('#loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = $('#loginPassword').value;
    const errorEl = $('#loginError');

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('bgAdmin', 'true');
      errorEl.textContent = '';
      showDashboard();
    } else {
      errorEl.textContent = 'Contraseña incorrecta. Intenta de nuevo.';
      $('#loginPassword').value = '';
      $('#loginPassword').focus();
    }
  });

  // Cerrar sesión
  $('#btnLogout').addEventListener('click', logout);
}

function showDashboard() {
  $('#loginScreen').classList.add('hidden');
  $('#adminDashboard').classList.add('active');
  loadReservations();
  subscribeRealtime();
}

function logout() {
  sessionStorage.removeItem('bgAdmin');
  if (realtimeChannel) {
    db.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  $('#adminDashboard').classList.remove('active');
  $('#loginScreen').classList.remove('hidden');
  $('#loginPassword').value = '';
  showToast('Sesión cerrada correctamente', 'info');
}

/* ══════════════════════════════════════════════════════════════════════
   6.  SIDEBAR & NAVIGATION
   ══════════════════════════════════════════════════════════════════════ */
function initSidebar() {
  const links = $$('.sidebar-nav a[data-section]');
  const menuToggle = $('#menuToggle');
  const sidebar = $('#adminSidebar');
  const backdrop = $('#sidebarBackdrop');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;

      // Update active link
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show section
      $$('.admin-section').forEach(s => s.classList.remove('active'));
      $(`#section-${sectionId}`).classList.add('active');

      // Close mobile sidebar
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  });

  // Mobile toggle
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
  });

  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  });
}

/* ══════════════════════════════════════════════════════════════════════
   7.  RESERVATION FORM
   ══════════════════════════════════════════════════════════════════════ */
function initReservationForm() {
  // Destino → Hotel
  $('#destino').addEventListener('change', () => {
    updateHotelOptions('destino', 'hotel', 'tipoHabitacion');
  });

  // Hotel → Tipo de Habitación
  $('#hotel').addEventListener('change', () => {
    updateRoomOptions('hotel', 'tipoHabitacion');
  });

  // Generación de huéspedes al cambiar adultos/niños
  $('#adultos').addEventListener('change', () => updateGuestInputs(''));
  $('#ninos').addEventListener('change', () => updateGuestInputs(''));
  
  // Sincronizar el nombre del titular con el primer huésped
  $('#clienteNombre').addEventListener('input', (e) => {
    const primerHuespedInput = $('#g-name-1');
    if (primerHuespedInput) {
      primerHuespedInput.value = e.target.value;
    }
  });

  // Saldo auto-calculation
  $('#montoTotal').addEventListener('input', calculateSaldo);
  $('#anticipo').addEventListener('input', calculateSaldo);

  // Form submission
  $('#reservationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#btnCrearReserva');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Generando...';

    try {
      const formData = gatherFormData('');
      const code = await generateReservationCode();

      const record = {
        codigo: code,
        estado: 'pendiente',
        cliente_nombre: formData.clienteNombre,
        cliente_email: formData.clienteEmail,
        cliente_telefono: formData.clienteTelefono,
        cliente_ciudad: formData.clienteCiudad,
        destino: formData.destino,
        hotel: formData.hotel,
        tipo_habitacion: formData.tipoHabitacion,
        fecha_entrada: formData.fechaEntrada || null,
        fecha_salida: formData.fechaSalida || null,
        adultos: formData.adultos,
        ninos: formData.ninos,
        vuelo_incluido: formData.vueloIncluido,
        traslados_incluidos: formData.trasladosIncluidos,
        monto_total: formData.montoTotal,
        anticipo: formData.anticipo,
        saldo_pendiente: formData.saldoPendiente,
        metodo_pago: formData.metodoPago,
        notas: formData.notas,
        nombres_huespedes: JSON.stringify(formData.nombresHuespedes),
        parques_incluidos: JSON.stringify(formData.parquesIncluidos)
      };

      const { error } = await db.from('reservas').insert([record]);

      if (error) throw error;

      // Show success modal
      $('#successCode').textContent = code;
      openModal('successModal');
      showToast('Reservación creada exitosamente', 'success');

      // Reset form
      $('#reservationForm').reset();
      $('#saldoPendiente').textContent = '$0.00 MXN';
      updateHotelOptions('destino', 'hotel', 'tipoHabitacion');
      $('#huespedesSection').style.display = 'none';
      $('#huespedesContainer').innerHTML = '';

      // Reload data
      await loadReservations();

    } catch (error) {
      console.error('Error al crear reservación:', error);
      showToast('Error al crear la reservación: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-ticket"></i> Generar Reserva';
    }
  });

  // Generar huéspedes iniciales (2 adultos, 0 niños)
  updateGuestInputs('');
}

// Genera dinámicamente inputs para los huéspedes
function updateGuestInputs(prefix = '') {
  const container = $(`#${prefix}huespedesContainer`);
  const section = $(`#${prefix}huespedesSection`);
  const adultos = parseInt($(`#${prefix}adultos`).value) || 1;
  const ninos = parseInt($(`#${prefix}ninos`).value) || 0;
  const total = adultos + ninos;

  // Guardar los nombres que ya estén escritos para no borrarlos
  const existingValues = [];
  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    existingValues.push(input.value);
  });

  container.innerHTML = '';
  
  if (total > 0) {
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
    return;
  }

  // Generar inputs para adultos
  for (let i = 1; i <= adultos; i++) {
    const div = document.createElement('div');
    div.className = 'form-group';
    
    const isTitular = (i === 1 && prefix === '');
    const labelText = isTitular ? 'Huésped 1 (Titular) *' : `Huésped ${i} (Adulto) *`;
    
    // Obtener valor previo o pre-llenar con el titular
    let val = existingValues[i - 1] || '';
    if (isTitular && !val) {
      val = $('#clienteNombre').value;
    }

    div.innerHTML = `
      <label>${labelText}</label>
      <input type="text" id="${prefix}g-name-${i}" placeholder="Nombre completo" value="${escapeHtml(val)}" required>
    `;
    container.appendChild(div);
  }

  // Generar inputs para niños
  for (let j = 1; j <= ninos; j++) {
    const idx = adultos + j;
    const div = document.createElement('div');
    div.className = 'form-group';
    let val = existingValues[idx - 1] || '';
    div.innerHTML = `
      <label>Huésped ${idx} (Niño) *</label>
      <input type="text" id="${prefix}g-name-${idx}" placeholder="Nombre completo" value="${escapeHtml(val)}" required>
    `;
    container.appendChild(div);
  }
}

// Recopila la información del formulario (válido para nueva reserva y editar)
function gatherFormData(prefix = '') {
  const monto = parseFloat($(`#${prefix}montoTotal`).value) || 0;
  const anticipo = parseFloat($(`#${prefix}anticipo`).value) || 0;
  
  // Recopilar nombres de los huéspedes
  const adultos = parseInt($(`#${prefix}adultos`).value) || 1;
  const ninos = parseInt($(`#${prefix}ninos`).value) || 0;
  const total = adultos + ninos;
  const nombresHuespedes = [];
  for (let i = 1; i <= total; i++) {
    const val = $(`#${prefix}g-name-${i}`) ? $(`#${prefix}g-name-${i}`).value.trim() : '';
    if (val) nombresHuespedes.push(val);
  }

  // Recopilar parques incluidos
  const selector = prefix === 'edit' ? 'input[name="editParques"]:checked' : 'input[name="parques"]:checked';
  const parquesIncluidos = Array.from(document.querySelectorAll(selector)).map(cb => cb.value);

  // Selector de total / editMonto
  const totalInput = prefix === 'edit' ? $(`#${prefix}Monto`) : $(`#${prefix}montoTotal`);
  const anticipoInput = prefix === 'edit' ? $(`#${prefix}Anticipo`) : $(`#${prefix}anticipo`);

  return {
    clienteNombre:    $(`#${prefix}Nombre` || `#clienteNombre`).value.trim(),
    clienteEmail:     $(`#${prefix}Email` || `#clienteEmail`).value.trim(),
    clienteTelefono:  $(`#${prefix}Telefono` || `#clienteTelefono`).value.trim(),
    clienteCiudad:    $(`#${prefix}Ciudad` || `#clienteCiudad`).value.trim(),
    destino:          $(`#${prefix}Destino` || `#destino`).value,
    hotel:            $(`#${prefix}Hotel` || `#hotel`).value,
    tipoHabitacion:   $(`#${prefix}TipoHabitacion` || `#tipoHabitacion`).value,
    fechaEntrada:     $(`#${prefix}FechaEntrada` || `#fechaEntrada`).value,
    fechaSalida:      $(`#${prefix}FechaSalida` || `#fechaSalida`).value,
    adultos:          adultos,
    ninos:            ninos,
    vueloIncluido:    $(`#${prefix}Vuelo` || `#vueloIncluido`).checked,
    trasladosIncluidos: ($(`#${prefix}Traslados` || `#trasladosIncluidos`)).checked,
    montoTotal:       parseFloat(totalInput.value) || 0,
    anticipo:         parseFloat(anticipoInput.value) || 0,
    saldoPendiente:   (parseFloat(totalInput.value) || 0) - (parseFloat(anticipoInput.value) || 0),
    metodoPago:       $(`#${prefix}MetodoPago` || `#metodoPago`).value,
    notas:            $(`#${prefix}Notas` || `#notas`).value.trim(),
    nombresHuespedes: nombresHuespedes,
    parquesIncluidos: parquesIncluidos
  };
}

/* ══════════════════════════════════════════════════════════════════════
   8.  DYNAMIC HOTEL & ROOM OPTIONS
   ══════════════════════════════════════════════════════════════════════ */
function updateHotelOptions(destinoSelectId, hotelSelectId, roomSelectId) {
  const destino = $(`#${destinoSelectId}`).value;
  const hotelSelect = $(`#${hotelSelectId}`);
  const roomSelect = $(`#${roomSelectId}`);
  
  hotelSelect.innerHTML = '';
  roomSelect.innerHTML = '<option value="">Primero selecciona un hotel</option>';

  if (!destino || !HOTEL_OPTIONS[destino]) {
    hotelSelect.innerHTML = '<option value="">Primero selecciona un destino</option>';
    return;
  }

  const hotels = HOTEL_OPTIONS[destino];
  hotelSelect.innerHTML = '<option value="">Seleccionar hotel</option>';
  hotels.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    hotelSelect.appendChild(opt);
  });
}

function updateRoomOptions(hotelSelectId, roomSelectId) {
  const hotel = $(`#${hotelSelectId}`).value;
  const roomSelect = $(`#${roomSelectId}`);
  
  roomSelect.innerHTML = '';

  if (!hotel) {
    roomSelect.innerHTML = '<option value="">Primero selecciona un hotel</option>';
    return;
  }

  // Si no está mapeado específicamente, usar opciones por defecto
  const rooms = ROOM_OPTIONS[hotel] || ROOM_OPTIONS['Otro'];
  
  roomSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
  rooms.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    roomSelect.appendChild(opt);
  });
}

/* ══════════════════════════════════════════════════════════════════════
   9.  SALDO CALCULATION
   ══════════════════════════════════════════════════════════════════════ */
function calculateSaldo() {
  const monto = parseFloat($('#montoTotal').value) || 0;
  const anticipo = parseFloat($('#anticipo').value) || 0;
  const saldo = monto - anticipo;
  $('#saldoPendiente').textContent = formatCurrency(saldo);
}

function calculateEditSaldo() {
  const monto = parseFloat($('#editMonto').value) || 0;
  const anticipo = parseFloat($('#editAnticipo').value) || 0;
  const saldo = monto - anticipo;
  $('#editSaldo').textContent = formatCurrency(saldo);
}

/* ══════════════════════════════════════════════════════════════════════
   10.  RESERVATION CODE GENERATOR
   ══════════════════════════════════════════════════════════════════════ */
async function generateReservationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let unique = false;
  let code = '';

  while (!unique) {
    code = 'BG-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check uniqueness in Supabase
    const { data, error } = await db
      .from('reservas')
      .select('id')
      .eq('codigo', code)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      unique = true;
    }
  }

  return code;
}

/* ══════════════════════════════════════════════════════════════════════
   11.  SUPABASE — LOAD RESERVATIONS
   ══════════════════════════════════════════════════════════════════════ */
async function loadReservations() {
  try {
    const { data, error } = await db
      .from('reservas')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) throw error;

    allReservations = (data || []).map(mapSupabaseRecord);
    updateStats(allReservations);
    filterReservations();
    renderDashboardTable(allReservations.slice(0, 5));
    renderCalendar();
  } catch (error) {
    console.error('Error al cargar reservaciones:', error);
    showToast('Error al cargar reservaciones', 'error');
  }
}

/* Mapea columnas de Supabase (snake_case) al objeto camelCase */
function mapSupabaseRecord(row) {
  let nombresHuespedes = [];
  let parquesIncluidos = [];

  try {
    if (row.nombres_huespedes) {
      nombresHuespedes = JSON.parse(row.nombres_huespedes);
    }
  } catch(e) {
    nombresHuespedes = row.nombres_huespedes ? row.nombres_huespedes.split(',').map(n => n.trim()) : [];
  }

  try {
    if (row.parques_incluidos) {
      parquesIncluidos = JSON.parse(row.parques_incluidos);
    }
  } catch(e) {
    parquesIncluidos = row.parques_incluidos ? row.parques_incluidos.split(',').map(p => p.trim()) : [];
  }

  return {
    id:                 row.id,
    codigo:             row.codigo,
    estado:             row.estado,
    clienteNombre:      row.cliente_nombre,
    clienteEmail:       row.cliente_email,
    clienteTelefono:    row.cliente_telefono,
    clienteCiudad:      row.cliente_ciudad,
    destino:            row.destino,
    hotel:              row.hotel,
    tipoHabitacion:     row.tipo_habitacion,
    fechaEntrada:       row.fecha_entrada,
    fechaSalida:        row.fecha_salida,
    adultos:            row.adultos,
    ninos:              row.ninos,
    vueloIncluido:      row.vuelo_incluido,
    trasladosIncluidos: row.traslados_incluidos,
    montoTotal:         parseFloat(row.monto_total) || 0,
    anticipo:           parseFloat(row.anticipo) || 0,
    saldoPendiente:     parseFloat(row.saldo_pendiente) || 0,
    metodoPago:         row.metodo_pago,
    notas:              row.notas,
    creadoEn:           row.creado_en,
    actualizadoEn:      row.actualizado_en,
    nombresHuespedes:   nombresHuespedes,
    parquesIncluidos:   parquesIncluidos
  };
}

/* ══════════════════════════════════════════════════════════════════════
   11b.  SUPABASE — REAL-TIME SUBSCRIPTION
   ══════════════════════════════════════════════════════════════════════ */
function subscribeRealtime() {
  if (realtimeChannel) {
    db.removeChannel(realtimeChannel);
  }

  realtimeChannel = db
    .channel('reservas-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservas' },
      () => {
        loadReservations();
      }
    )
    .subscribe();
}

/* ══════════════════════════════════════════════════════════════════════
   12.  RENDER TABLES
   ══════════════════════════════════════════════════════════════════════ */
function renderReservationsTable(reservations) {
  const tbody = $('#reservationsTableBody');

  if (reservations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="table-empty">
            <i class="fas fa-inbox"></i>
            <p>No se encontraron reservaciones</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = reservations.map(r => `
    <tr>
      <td class="code-cell">${r.codigo || '—'}</td>
      <td>${escapeHtml(r.clienteNombre || '—')}</td>
      <td>${escapeHtml(r.destino || '—')}</td>
      <td>${formatDate(r.fechaEntrada)} — ${formatDate(r.fechaSalida)}</td>
      <td>${formatCurrency(r.montoTotal || 0)}</td>
      <td>${renderBadge(r.estado)}</td>
      <td class="actions-cell">
        <button class="btn btn-primary btn-icon" title="Editar" onclick="openEditModal('${r.id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn btn-danger btn-icon" title="Eliminar" onclick="openDeleteModal('${r.id}', '${r.codigo}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderDashboardTable(reservations) {
  const tbody = $('#dashboardTableBody');

  if (reservations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <i class="fas fa-inbox"></i>
            <p>Aún no hay reservaciones registradas</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = reservations.map(r => `
    <tr>
      <td class="code-cell">${r.codigo || '—'}</td>
      <td>${escapeHtml(r.clienteNombre || '—')}</td>
      <td>${escapeHtml(r.destino || '—')}</td>
      <td>${formatDate(r.fechaEntrada)} — ${formatDate(r.fechaSalida)}</td>
      <td>${formatCurrency(r.montoTotal || 0)}</td>
      <td>${renderBadge(r.estado)}</td>
    </tr>
  `).join('');
}

function renderBadge(estado) {
  const map = {
    pendiente:  { cls: 'badge-pendiente',  icon: 'fa-clock',        text: 'Pendiente' },
    confirmada: { cls: 'badge-confirmada', icon: 'fa-check-circle', text: 'Confirmada' },
    cancelada:  { cls: 'badge-cancelada',  icon: 'fa-times-circle', text: 'Cancelada' }
  };
  const info = map[estado] || map.pendiente;
  return `<span class="badge ${info.cls}"><i class="fas ${info.icon}"></i> ${info.text}</span>`;
}

/* ══════════════════════════════════════════════════════════════════════
   13.  FILTER & SEARCH
   ══════════════════════════════════════════════════════════════════════ */
function initFilters() {
  $('#searchInput').addEventListener('input', filterReservations);
  $('#filterStatus').addEventListener('change', filterReservations);
}

function filterReservations() {
  const search = ($('#searchInput').value || '').toLowerCase().trim();
  const status = ($('#filterStatus').value || '').toLowerCase();

  let filtered = allReservations;

  if (search) {
    filtered = filtered.filter(r => {
      const hay = [
        r.codigo, r.clienteNombre, r.destino, r.hotel,
        r.clienteEmail, r.clienteTelefono
      ].join(' ').toLowerCase();
      return hay.includes(search);
    });
  }

  if (status) {
    filtered = filtered.filter(r => r.estado === status);
  }

  // Filtrar adicional por fecha del calendario si está seleccionada
  if (selectedFilterDate) {
    filtered = filtered.filter(r => r.fechaEntrada === selectedFilterDate || r.fechaSalida === selectedFilterDate);
  }

  renderReservationsTable(filtered);
}

/* ══════════════════════════════════════════════════════════════════════
   14.  STATS
   ══════════════════════════════════════════════════════════════════════ */
function updateStats(reservations) {
  const total = reservations.length;
  const pendientes = reservations.filter(r => r.estado === 'pendiente').length;
  const confirmadas = reservations.filter(r => r.estado === 'confirmada').length;
  const ingresos = reservations.reduce((sum, r) => sum + (r.montoTotal || 0), 0);

  // Dashboard section stats
  $('#statTotal').textContent = total;
  $('#statPendientes').textContent = pendientes;
  $('#statConfirmadas').textContent = confirmadas;
  $('#statIngresos').textContent = formatCurrency(ingresos);

  // Reservations section mirror stats
  $$('.stat-total-mirror').forEach(el => el.textContent = total);
  $$('.stat-pendientes-mirror').forEach(el => el.textContent = pendientes);
  $$('.stat-confirmadas-mirror').forEach(el => el.textContent = confirmadas);
  $$('.stat-ingresos-mirror').forEach(el => el.textContent = formatCurrency(ingresos));
}

/* ══════════════════════════════════════════════════════════════════════
   15.  EDIT MODAL
   ══════════════════════════════════════════════════════════════════════ */
function initEditFormListeners() {
  // Destino → Hotel
  $('#editDestino').addEventListener('change', () => {
    updateHotelOptions('editDestino', 'editHotel', 'editTipoHabitacion');
  });

  // Hotel → Habitación
  $('#editHotel').addEventListener('change', () => {
    updateRoomOptions('editHotel', 'editTipoHabitacion');
  });

  // Cambios en adultos/niños en edición
  $('#editAdultos').addEventListener('change', () => updateGuestInputs('edit'));
  $('#editNinos').addEventListener('change', () => updateGuestInputs('edit'));

  // Saldo
  $('#editMonto').addEventListener('input', calculateEditSaldo);
  $('#editAnticipo').addEventListener('input', calculateEditSaldo);
}

function openEditModal(docId) {
  const reservation = allReservations.find(r => r.id === docId);
  if (!reservation) {
    showToast('Reservación no encontrada', 'error');
    return;
  }

  // Populate fields
  $('#editDocId').value = docId;
  $('#editEstado').value = reservation.estado || 'pendiente';
  $('#editNombre').value = reservation.clienteNombre || '';
  $('#editEmail').value = reservation.clienteEmail || '';
  $('#editTelefono').value = reservation.clienteTelefono || '';
  $('#editCiudad').value = reservation.clienteCiudad || '';
  $('#editDestino').value = reservation.destino || '';

  // Update hotel options then set value
  updateHotelOptions('editDestino', 'editHotel', 'editTipoHabitacion');
  
  // Pequeña demora para asegurar que las opciones se renderizan
  setTimeout(() => {
    $('#editHotel').value = reservation.hotel || '';
    
    // Cargar habitaciones dinámicas según el hotel seleccionado
    updateRoomOptions('editHotel', 'editTipoHabitacion');
    
    setTimeout(() => {
      $('#editTipoHabitacion').value = reservation.tipoHabitacion || '';
    }, 10);
  }, 10);

  $('#editFechaEntrada').value = reservation.fechaEntrada || '';
  $('#editFechaSalida').value = reservation.fechaSalida || '';
  $('#editAdultos').value = reservation.adultos || 1;
  $('#editNinos').value = reservation.ninos || 0;
  $('#editVuelo').checked = reservation.vueloIncluido || false;
  $('#editTraslados').checked = reservation.trasladosIncluidos || false;
  $('#editMonto').value = reservation.montoTotal || 0;
  $('#editAnticipo').value = reservation.anticipo || 0;
  calculateEditSaldo();
  $('#editMetodoPago').value = reservation.metodoPago || 'Transferencia bancaria';
  $('#editNotas').value = reservation.notas || '';

  // Renderizar e re-poblar los huéspedes
  updateGuestInputs('edit');
  
  // Rellenar las cajas de texto de los huéspedes guardados
  setTimeout(() => {
    const container = $('#editHuespedesContainer');
    const inputs = container.querySelectorAll('input');
    const savedNames = reservation.nombresHuespedes || [];
    
    inputs.forEach((input, idx) => {
      if (savedNames[idx]) {
        input.value = savedNames[idx];
      }
    });
  }, 50);

  // Limpiar y poblar los checkboxes de Parques
  const parkCheckboxes = document.querySelectorAll('input[name="editParques"]');
  parkCheckboxes.forEach(cb => {
    cb.checked = (reservation.parquesIncluidos || []).includes(cb.value);
  });

  openModal('editModal');
}

async function saveEdit() {
  const docId = $('#editDocId').value;
  if (!docId) return;

  const btn = $('#btnGuardarEdicion');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Guardando...';

  const formData = gatherFormData('edit');

  const updatedData = {
    estado:              formData.estado,
    cliente_nombre:      formData.clienteNombre,
    cliente_email:       formData.clienteEmail,
    cliente_telefono:    formData.clienteTelefono,
    cliente_ciudad:      formData.clienteCiudad,
    destino:             formData.destino,
    hotel:               formData.hotel,
    tipo_habitacion:     formData.tipoHabitacion,
    fecha_entrada:       formData.fechaEntrada || null,
    fecha_salida:        formData.fechaSalida || null,
    adultos:             formData.adultos,
    ninos:               formData.ninos,
    vuelo_incluido:      formData.vueloIncluido,
    traslados_incluidos: formData.trasladosIncluidos,
    monto_total:         formData.montoTotal,
    anticipo:            formData.anticipo,
    saldo_pendiente:     formData.saldoPendiente,
    metodo_pago:         formData.metodoPago,
    notas:               formData.notas,
    nombres_huespedes:  JSON.stringify(formData.nombresHuespedes),
    parques_incluidos:  JSON.stringify(formData.parquesIncluidos),
    actualizado_en:      new Date().toISOString()
  };

  try {
    const { error } = await db
      .from('reservas')
      .update(updatedData)
      .eq('id', docId);

    if (error) throw error;

    closeModal('editModal');
    showToast('Reservación actualizada exitosamente', 'success');
    await loadReservations();
  } catch (error) {
    console.error('Error al actualizar:', error);
    showToast('Error al actualizar: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
  }
}

/* ══════════════════════════════════════════════════════════════════════
   16.  DELETE
   ══════════════════════════════════════════════════════════════════════ */
function openDeleteModal(docId, code) {
  deleteTargetId = docId;
  deleteTargetCode = code;
  $('#deleteCodeDisplay').textContent = code;
  openModal('deleteModal');
}

async function confirmDelete() {
  if (!deleteTargetId) return;

  const btn = $('#btnConfirmDelete');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Eliminando...';

  try {
    const { error } = await db
      .from('reservas')
      .delete()
      .eq('id', deleteTargetId);

    if (error) throw error;

    closeModal('deleteModal');
    showToast(`Reservación ${deleteTargetCode} eliminada`, 'success');
    await loadReservations();
  } catch (error) {
    console.error('Error al eliminar:', error);
    showToast('Error al eliminar: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    deleteTargetId = null;
    deleteTargetCode = null;
  }
}

/* ══════════════════════════════════════════════════════════════════════
   17.  CALENDAR WIDGET LOGIC
   ══════════════════════════════════════════════════════════════════════ */
function initCalendarListeners() {
  $('#prevMonthBtn').addEventListener('click', () => {
    currentCalMonth--;
    if (currentCalMonth < 0) {
      currentCalMonth = 11;
      currentCalYear--;
    }
    renderCalendar();
  });

  $('#nextMonthBtn').addEventListener('click', () => {
    currentCalMonth++;
    if (currentCalMonth > 11) {
      currentCalMonth = 0;
      currentCalYear++;
    }
    renderCalendar();
  });
}

function renderCalendar() {
  const daysContainer = $('#calendarDays');
  const monthYearLabel = $('#calendarMonthYear');
  daysContainer.innerHTML = '';

  // Establecer mes y año actual en la cabecera
  monthYearLabel.textContent = `${MESES_ES_LARGOS[currentCalMonth]} ${currentCalYear}`;

  // Obtener primer día de la semana y cantidad de días del mes
  const firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay();
  const totalDays = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();

  // Generar espacios en blanco para días anteriores
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    daysContainer.appendChild(emptyCell);
  }

  // Generar días reales
  const today = new Date();
  
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = day;

    // Formatear fecha para verificar ocupación (Formato "YYYY-MM-DD")
    const mm = String(currentCalMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${currentCalYear}-${mm}-${dd}`;

    // Validar si es el día de hoy
    if (today.getDate() === day && today.getMonth() === currentCalMonth && today.getFullYear() === currentCalYear) {
      dayCell.classList.add('today');
    }

    // Validar si es el día actualmente seleccionado para el filtro
    if (selectedFilterDate === dateStr) {
      dayCell.classList.add('selected-filter');
    }

    // Buscar reservas en este día
    const checkins = allReservations.filter(r => r.fechaEntrada === dateStr);
    const checkouts = allReservations.filter(r => r.fechaSalida === dateStr);

    if (checkins.length > 0 || checkouts.length > 0) {
      const indicators = document.createElement('div');
      indicators.className = 'day-indicators';
      
      if (checkins.length > 0) {
        const dot = document.createElement('span');
        dot.className = 'day-dot checkin';
        dot.title = `${checkins.length} check-in(s)`;
        indicators.appendChild(dot);
      }
      
      if (checkouts.length > 0) {
        const dot = document.createElement('span');
        dot.className = 'day-dot checkout';
        dot.title = `${checkouts.length} check-out(s)`;
        indicators.appendChild(dot);
      }
      
      dayCell.appendChild(indicators);
    }

    // Evento de clic para filtrar la lista por la fecha seleccionada
    dayCell.addEventListener('click', () => {
      if (selectedFilterDate === dateStr) {
        // Deseleccionar
        selectedFilterDate = null;
      } else {
        // Seleccionar
        selectedFilterDate = dateStr;
      }
      renderCalendar();
      filterReservations();
    });

    daysContainer.appendChild(dayCell);
  }
}

/* ══════════════════════════════════════════════════════════════════════
   18.  MODALS
   ══════════════════════════════════════════════════════════════════════ */
function openModal(modalId) {
  $(`#${modalId}`).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  $(`#${modalId}`).classList.remove('active');
  document.body.style.overflow = '';
}

// Clic en fondo cierra modal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ESC cierra modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

/* ══════════════════════════════════════════════════════════════════════
   19.  COPY CODE
   ══════════════════════════════════════════════════════════════════════ */
function copyCode() {
  const code = $('#successCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código copiado al portapapeles', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Código copiado al portapapeles', 'success');
  });
}

/* ══════════════════════════════════════════════════════════════════════
   20.  FORMATTING HELPERS
   ══════════════════════════════════════════════════════════════════════ */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '$' + num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' MXN';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const parts = String(dateString).split('-');
  if (parts.length !== 3) return dateString;
  const day = parseInt(parts[2]);
  const month = MESES_ES[parseInt(parts[1]) - 1];
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ══════════════════════════════════════════════════════════════════════
   21.  TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = $('#toastContainer');
  const icons = {
    success: 'fa-check-circle',
    error:   'fa-exclamation-circle',
    info:    'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-eliminar después de 4 segundos
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
