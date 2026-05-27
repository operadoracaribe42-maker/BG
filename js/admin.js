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
let lastCreatedReservation = null;

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

  // Fecha Entrada/Salida para calcular noches
  $('#fechaEntrada').addEventListener('change', () => calculateNights(''));
  $('#fechaSalida').addEventListener('change', () => calculateNights(''));

  // Vuelo incluido toggle
  $('#vueloIncluido').addEventListener('change', (e) => {
    $('#vueloSection').style.display = e.target.checked ? 'block' : 'none';
  });

  // Traslados incluidos toggle
  $('#trasladosIncluidos').addEventListener('change', (e) => {
    $('#tipoTrasladoGroup').style.display = e.target.checked ? 'block' : 'none';
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
        parques_incluidos: JSON.stringify(formData.parquesIncluidos),
        
        // Nuevos campos mapeados en la inserción
        cantidad_noches: calculateNights(''),
        edades_ninos: JSON.stringify(formData.edadesNinos),
        agente_nombre: formData.agenteNombre,
        plan_alimentos: formData.planAlimentos,
        peticiones_especiales: formData.peticionesEspeciales,
        vuelo_ida: formData.vueloIda,
        vuelo_vuelta: formData.vueloVuelta,
        tipo_traslado: formData.tipoTraslado
      };

      const { error } = await db.from('reservas').insert([record]);

      if (error) throw error;

      // Guardar última reserva creada para copiar plantilla de correo
      lastCreatedReservation = {
        codigo: code,
        clienteNombre: formData.clienteNombre,
        destino: formData.destino,
        hotel: formData.hotel,
        tipoHabitacion: formData.tipoHabitacion,
        fechaEntrada: formData.fechaEntrada,
        fechaSalida: formData.fechaSalida,
        nombresHuespedes: formData.nombresHuespedes,
        parquesIncluidos: formData.parquesIncluidos,
        saldoPendiente: formData.saldoPendiente,
        adultos: formData.adultos,
        ninos: formData.ninos,
        
        // Nuevos campos agregados
        planAlimentos: formData.planAlimentos,
        cantidadNoches: calculateNights(''),
        vueloIncluido: formData.vueloIncluido,
        vueloIda: formData.vueloIda,
        vueloVuelta: formData.vueloVuelta,
        trasladosIncluidos: formData.trasladosIncluidos,
        tipoTraslado: formData.tipoTraslado,
        agenteNombre: formData.agenteNombre,
        peticionesEspeciales: formData.peticionesEspeciales
      };

      // Show success modal
      $('#successCode').textContent = code;
      openModal('successModal');
      showToast('Reservación creada exitosamente', 'success');

      // Reset form
      $('#reservationForm').reset();
      $('#saldoPendiente').textContent = '$0.00 MXN';
      $('#nochesDisplay').textContent = '—';
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

// Calcula dinámicamente la cantidad de noches entre fecha de entrada y salida
function calculateNights(prefix = '') {
  const isEdit = prefix === 'edit';
  const entradaInput = isEdit ? $('#editFechaEntrada') : $('#fechaEntrada');
  const salidaInput = isEdit ? $('#editFechaSalida') : $('#fechaSalida');
  const displayEl = isEdit ? $('#editNochesDisplay') : $('#nochesDisplay');

  if (!entradaInput || !salidaInput || !displayEl) return 0;

  const entradaVal = entradaInput.value;
  const salidaVal = salidaInput.value;

  if (entradaVal && salidaVal) {
    const dateEntrada = new Date(entradaVal + 'T00:00:00');
    const dateSalida = new Date(salidaVal + 'T00:00:00');
    const diffTime = dateSalida - dateEntrada;
    if (diffTime > 0) {
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      displayEl.textContent = `${diffDays} noche${diffDays > 1 ? 's' : ''}`;
      return diffDays;
    } else if (diffTime === 0) {
      displayEl.textContent = 'Mismo día (0 noches)';
      return 0;
    } else {
      displayEl.textContent = 'Salida anterior a Entrada';
      return 0;
    }
  } else {
    displayEl.textContent = '—';
    return 0;
  }
}

// Genera dinámicamente inputs para los huéspedes
function updateGuestInputs(prefix = '') {
  const isEdit = prefix === 'edit';
  const container = isEdit ? $('#editHuespedesContainer') : $('#huespedesContainer');
  const section = isEdit ? $('#editHuespedesSection') : $('#huespedesSection');
  const adultos = parseInt((isEdit ? $('#editAdultos') : $('#adultos')).value) || 1;
  const ninos = parseInt((isEdit ? $('#editNinos') : $('#ninos')).value) || 0;
  const total = adultos + ninos;

  // Guardar los nombres y edades que ya estén escritos para no borrarlos
  const existingValues = [];
  const existingAges = [];
  
  const nameInputs = container.querySelectorAll('.guest-name-input');
  if (nameInputs.length > 0) {
    nameInputs.forEach(input => {
      existingValues.push(input.value);
    });
  } else {
    const oldInputs = container.querySelectorAll('input[type="text"]');
    oldInputs.forEach(input => {
      existingValues.push(input.value);
    });
  }

  const ageInputs = container.querySelectorAll('.guest-age-input');
  ageInputs.forEach(input => {
    existingAges.push(input.value);
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
    
    const isTitular = (i === 1 && !isEdit);
    const labelText = isTitular ? 'Huésped 1 (Titular) *' : `Huésped ${i} (Adulto) *`;
    
    let val = existingValues[i - 1] || '';
    if (isTitular && !val) {
      val = $('#clienteNombre').value;
    }

    div.innerHTML = `
      <label>${labelText}</label>
      <input type="text" id="${prefix ? prefix + 'g' : 'g'}-name-${i}" class="guest-name-input" placeholder="Nombre completo" value="${escapeHtml(val)}" required>
    `;
    container.appendChild(div);
  }

  // Generar inputs para niños
  for (let j = 1; j <= ninos; j++) {
    const idx = adultos + j;
    const div = document.createElement('div');
    div.className = 'form-group';
    
    let val = existingValues[idx - 1] || '';
    let ageVal = existingAges[j - 1] || '';
    
    div.innerHTML = `
      <label>Huésped ${idx} (Niño) *</label>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="${prefix ? prefix + 'g' : 'g'}-name-${idx}" class="guest-name-input" placeholder="Nombre completo" value="${escapeHtml(val)}" style="flex: 2;" required>
        <input type="number" id="${prefix ? prefix + 'g' : 'g'}-age-${idx}" class="guest-age-input" placeholder="Edad" min="0" max="17" value="${escapeHtml(ageVal)}" style="flex: 1;" required>
      </div>
    `;
    container.appendChild(div);
  }
}

// Recopila la información del formulario (válido para nueva reserva y editar)
function gatherFormData(prefix = '') {
  const isEdit = prefix === 'edit';

  const clienteNombre = (isEdit ? $('#editNombre') : $('#clienteNombre')).value.trim();
  const clienteEmail = (isEdit ? $('#editEmail') : $('#clienteEmail')).value.trim();
  const clienteTelefono = (isEdit ? $('#editTelefono') : $('#clienteTelefono')).value.trim();
  const clienteCiudad = (isEdit ? $('#editCiudad') : $('#clienteCiudad')).value.trim();
  
  const destino = (isEdit ? $('#editDestino') : $('#destino')).value;
  const hotel = (isEdit ? $('#editHotel') : $('#hotel')).value;
  const tipoHabitacion = (isEdit ? $('#editTipoHabitacion') : $('#tipoHabitacion')).value;
  
  const fechaEntrada = (isEdit ? $('#editFechaEntrada') : $('#fechaEntrada')).value;
  const fechaSalida = (isEdit ? $('#editFechaSalida') : $('#fechaSalida')).value;
  
  const adultos = parseInt((isEdit ? $('#editAdultos') : $('#adultos')).value) || 1;
  const ninos = parseInt((isEdit ? $('#editNinos') : $('#ninos')).value) || 0;
  
  const vueloIncluido = (isEdit ? $('#editVuelo') : $('#vueloIncluido')).checked;
  const trasladosIncluidos = (isEdit ? $('#editTraslados') : $('#trasladosIncluidos')).checked;
  const tipoTraslado = (isEdit ? $('#editTipoTraslado') : $('#tipoTraslado')).value;
  
  const vueloIda = (isEdit ? $('#editVueloDetalleIda') : $('#vueloDetalleIda')).value.trim();
  const vueloVuelta = (isEdit ? $('#editVueloDetalleVuelta') : $('#vueloDetalleVuelta')).value.trim();
  
  const totalInput = isEdit ? $('#editMonto') : $('#montoTotal');
  const anticipoInput = isEdit ? $('#editAnticipo') : $('#anticipo');
  
  const montoTotal = parseFloat(totalInput.value) || 0;
  const anticipo = parseFloat(anticipoInput.value) || 0;
  const saldoPendiente = montoTotal - anticipo;
  
  const metodoPago = (isEdit ? $('#editMetodoPago') : $('#metodoPago')).value;
  const notas = (isEdit ? $('#editNotas') : $('#notas')).value.trim();
  
  const total = adultos + ninos;
  const nombresHuespedes = [];
  const edadesNinos = [];
  
  for (let i = 1; i <= total; i++) {
    const val = $(`#${prefix ? prefix + 'g' : 'g'}-name-${i}`) ? $(`#${prefix ? prefix + 'g' : 'g'}-name-${i}`).value.trim() : '';
    if (val) nombresHuespedes.push(val);
  }
  
  for (let j = 1; j <= ninos; j++) {
    const idx = adultos + j;
    const ageVal = $(`#${prefix ? prefix + 'g' : 'g'}-age-${idx}`) ? parseInt($(`#${prefix ? prefix + 'g' : 'g'}-age-${idx}`).value) || 0 : 0;
    edadesNinos.push(ageVal);
  }
  
  const selector = isEdit ? 'input[name="editParques"]:checked' : 'input[name="parques"]:checked';
  const parquesIncluidos = Array.from(document.querySelectorAll(selector)).map(cb => cb.value);

  // Nuevos campos
  const agenteNombre = (isEdit ? $('#editAgenteNombre') : $('#agenteNombre')).value.trim();
  const planAlimentos = (isEdit ? $('#editPlanAlimentos') : $('#planAlimentos')).value;
  const peticionesEspeciales = (isEdit ? $('#editPeticionesEspeciales') : $('#peticionesEspeciales')).value.trim();

  return {
    estado: isEdit ? $('#editEstado').value : 'pendiente',
    clienteNombre,
    clienteEmail,
    clienteTelefono,
    clienteCiudad,
    destino,
    hotel,
    tipoHabitacion,
    fechaEntrada,
    fechaSalida,
    adultos,
    ninos,
    vueloIncluido,
    trasladosIncluidos,
    tipoTraslado,
    vueloIda,
    vueloVuelta,
    montoTotal,
    anticipo,
    saldoPendiente,
    metodoPago,
    notas,
    nombresHuespedes,
    parquesIncluidos,
    edadesNinos,
    agenteNombre,
    planAlimentos,
    peticionesEspeciales
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
  let edadesNinos = [];

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

  try {
    if (row.edades_ninos) {
      edadesNinos = JSON.parse(row.edades_ninos);
    }
  } catch(e) {
    edadesNinos = row.edades_ninos ? row.edades_ninos.split(',').map(n => parseInt(n.trim()) || 0) : [];
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
    parquesIncluidos:   parquesIncluidos,
    
    // Mapeo de nuevos campos
    cantidadNoches:     parseInt(row.cantidad_noches) || 0,
    edadesNinos:        edadesNinos,
    agenteNombre:       row.agente_nombre || '',
    planAlimentos:      row.plan_alimentos || 'Solo Habitación',
    peticionesEspeciales: row.peticiones_especiales || '',
    vueloIda:           row.vuelo_ida || '',
    vueloVuelta:        row.vuelo_vuelta || '',
    tipoTraslado:       row.tipo_traslado || 'Compartido'
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

  // Fecha Entrada/Salida para calcular noches
  $('#editFechaEntrada').addEventListener('change', () => calculateNights('edit'));
  $('#editFechaSalida').addEventListener('change', () => calculateNights('edit'));

  // Vuelo incluido toggle
  $('#editVuelo').addEventListener('change', (e) => {
    $('#editVueloSection').style.display = e.target.checked ? 'block' : 'none';
  });

  // Traslados incluidos toggle
  $('#editTraslados').addEventListener('change', (e) => {
    $('#editTipoTrasladoGroup').style.display = e.target.checked ? 'block' : 'none';
  });

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
  $('#editAgenteNombre').value = reservation.agenteNombre || '';
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
      $('#editPlanAlimentos').value = reservation.planAlimentos || 'Solo Habitación';
    }, 10);
  }, 10);

  $('#editFechaEntrada').value = reservation.fechaEntrada || '';
  $('#editFechaSalida').value = reservation.fechaSalida || '';
  calculateNights('edit');

  $('#editAdultos').value = reservation.adultos || 1;
  $('#editNinos').value = reservation.ninos || 0;
  
  // Vuelo
  const vueloCheck = reservation.vueloIncluido || false;
  $('#editVuelo').checked = vueloCheck;
  $('#editVueloSection').style.display = vueloCheck ? 'block' : 'none';
  $('#editVueloDetalleIda').value = reservation.vueloIda || '';
  $('#editVueloDetalleVuelta').value = reservation.vueloVuelta || '';

  // Traslados
  const trasladosCheck = reservation.trasladosIncluidos || false;
  $('#editTraslados').checked = trasladosCheck;
  $('#editTipoTrasladoGroup').style.display = trasladosCheck ? 'block' : 'none';
  $('#editTipoTraslado').value = reservation.tipoTraslado || 'Compartido';

  $('#editMonto').value = reservation.montoTotal || 0;
  $('#editAnticipo').value = reservation.anticipo || 0;
  calculateEditSaldo();
  $('#editMetodoPago').value = reservation.metodoPago || 'Transferencia bancaria';
  $('#editPeticionesEspeciales').value = reservation.peticionesEspeciales || '';
  $('#editNotas').value = reservation.notas || '';

  // Renderizar e re-poblar los huéspedes
  updateGuestInputs('edit');
  
  // Rellenar las cajas de texto de los huéspedes guardados
  setTimeout(() => {
    const container = $('#editHuespedesContainer');
    const nameInputs = container.querySelectorAll('.guest-name-input');
    const ageInputs = container.querySelectorAll('.guest-age-input');
    
    const savedNames = reservation.nombresHuespedes || [];
    const savedAges = reservation.edadesNinos || [];
    
    nameInputs.forEach((input, idx) => {
      if (savedNames[idx]) {
        input.value = savedNames[idx];
      }
    });
    
    ageInputs.forEach((input, idx) => {
      if (savedAges[idx] !== undefined && savedAges[idx] !== null) {
        input.value = savedAges[idx];
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
    
    // Nuevos campos
    cantidad_noches:     calculateNights('edit'),
    edades_ninos:        JSON.stringify(formData.edadesNinos),
    agente_nombre:       formData.agenteNombre,
    plan_alimentos:      formData.planAlimentos,
    peticiones_especiales: formData.peticionesEspeciales,
    vuelo_ida:           formData.vueloIda,
    vuelo_vuelta:        formData.vueloVuelta,
    tipo_traslado:       formData.tipoTraslado,

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
   16.  COPY CODE
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

function copyEmailTemplate() {
  if (!lastCreatedReservation) {
    showToast('No hay reservación reciente para generar correo', 'error');
    return;
  }
  
  const r = lastCreatedReservation;
  const entryDate = formatDate(r.fechaEntrada);
  const exitDate = formatDate(r.fechaSalida);
  
  // Nombres de huéspedes
  const huespedesStr = r.nombresHuespedes && r.nombresHuespedes.length > 0 
    ? r.nombresHuespedes.map(name => escapeHtml(name)).join(', ') 
    : '—';
    
  // Parques incluidos
  const parksStr = r.parquesIncluidos && r.parquesIncluidos.length > 0
    ? r.parquesIncluidos.map(park => escapeHtml(park)).join(', ')
    : '—';
  
  // Plantilla HTML de lujo para correos electrónicos (adaptable y compatible con clientes de correo)
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Confirmación de Reserva</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: 'Outfit', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="background-color: #FAF8F5; padding: 20px 10px; width: 100%;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E6ECEB; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(13, 92, 99, 0.05);">
      
      <!-- Header -->
      <div style="background-color: #0D5C63; padding: 30px 20px; text-align: center; color: #FFFFFF;">
        <h2 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">BG CARIBE</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #E6EFF0; text-transform: uppercase; letter-spacing: 1px;">Confirmación Oficial de Viaje</p>
      </div>
      
      <!-- Content Body -->
      <div style="padding: 30px 24px;">
        <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #1E252B;">¡Hola, ${escapeHtml(r.clienteNombre)}!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #5C6770; margin-bottom: 24px;">Te confirmamos que tu reservación ha sido generada con éxito. A continuación te presentamos el resumen de tu itinerario de viaje y detalles del paquete:</p>
        
        <!-- Código de Reserva Block -->
        <div style="margin: 20px 0; border: 1px solid #E6ECEB; border-radius: 6px; padding: 16px; background-color: #FAF8F5; text-align: center;">
          <span style="font-size: 11px; color: #95A5A6; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">CÓDIGO DE RESERVACIÓN</span>
          <strong style="font-size: 20px; color: #0D5C63; letter-spacing: 0.5px;">${escapeHtml(r.codigo)}</strong>
        </div>
        
        <!-- Detalles Table -->
        <h3 style="border-bottom: 2px solid #E6EFF0; padding-bottom: 8px; color: #0D5C63; font-size: 15px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Detalles del Itinerario</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1E252B;">
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6; width: 35%;">Destino:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6; font-weight: bold;">${escapeHtml(r.destino)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Hotel / Resort:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6; font-weight: bold;">${escapeHtml(r.hotel)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Habitación:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">${escapeHtml(r.tipoHabitacion)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Plan de Alimentos:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">${escapeHtml(r.planAlimentos)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Fechas:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6; font-weight: 500;">${entryDate} al ${exitDate} (${r.cantidadNoches} noches)</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Pasajeros:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">${r.adultos} Adulto(s) ${r.ninos > 0 ? `, ${r.ninos} Niño(s)` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Huéspedes:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6; font-size: 13px;">${huespedesStr}</td>
          </tr>
          ${r.vueloIncluido ? `
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Vuelo de Ida:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">${escapeHtml(r.vueloIda || 'Incluido')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Vuelo de Regreso:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">${escapeHtml(r.vueloVuelta || 'Incluido')}</td>
          </tr>
          ` : ''}
          ${r.trasladosIncluidos ? `
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Traslados:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">Incluidos (${escapeHtml(r.tipoTraslado)})</td>
          </tr>
          ` : ''}
          ${r.parquesIncluidos && r.parquesIncluidos.length > 0 ? `
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Parques Incluidos:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6; color: #0D5C63; font-weight: 600;">${parksStr}</td>
          </tr>
          ` : ''}
          ${r.agenteNombre ? `
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Agente de Viajes:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6;">${escapeHtml(r.agenteNombre)}</td>
          </tr>
          ` : ''}
          ${r.peticionesEspeciales ? `
          <tr>
            <td style="padding: 10px 0; color: #7F8C8D; border-bottom: 1px solid #f3f6f6;">Peticiones Especiales:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f6f6; font-style: italic; color: #5C6770;">${escapeHtml(r.peticionesEspeciales)}</td>
          </tr>
          ` : ''}
        </table>
        
        <!-- Saldo Box -->
        <div style="background-color: #FAF8F5; border: 1px dashed #D1AC70; border-radius: 6px; padding: 18px; margin: 24px 0; text-align: center;">
          <span style="font-size: 11px; text-transform: uppercase; color: #BFA063; font-weight: bold; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">Saldo Pendiente a Liquidar</span>
          <span style="font-size: 22px; font-weight: bold; color: #0D5C63;">${formatCurrency(r.saldoPendiente)}</span>
        </div>
        
        <!-- CTA Link -->
        <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
          <p style="font-size: 13px; color: #7F8C8D; margin-bottom: 16px;">Puedes consultar los detalles oficiales, vuelos, traslados y descargar tu comprobante digital en cualquier momento entrando a nuestro portal:</p>
          <a href="https://confirmacion.bgcaribe.mx/?codigo=${r.codigo}" style="background-color: #D1AC70; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">Ver Comprobante de Viaje</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #FAF8F5; padding: 20px; text-align: center; font-size: 11px; color: #7F8C8D; border-top: 1px solid #E6ECEB;">
        <strong>BG Transportadora del Caribe S.A. de C.V.</strong><br>
        RNT: 0423005C28259<br>
        ¿Tienes dudas o necesitas asistencia? Contáctanos a nuestro <a href="https://wa.me/5219862444375" style="color: #0D5C63; text-decoration: none; font-weight: bold;">WhatsApp de Soporte</a>
      </div>
      
    </div>
  </div>
</body>
</html>
  `.trim();

  // Texto plano como fallback
  const text = `BG CARIBE - Confirmación de Reservación\n\n¡Tu reservación está lista!\n\nHola, ${r.clienteNombre}. Te confirmamos tu reservación con código: ${r.codigo}.\n\nDetalles del viaje:\n- Destino: ${r.destino}\n- Hotel: ${r.hotel}\n- Habitación: ${r.tipoHabitacion}\n- Fechas: ${entryDate} al ${exitDate} (${r.cantidadNoches} noches)\n- Huéspedes: ${r.nombresHuespedes.join(', ')}\n${r.parquesIncluidos.length > 0 ? `- Parques: ${r.parquesIncluidos.join(', ')}\n` : ''}- Saldo Pendiente: ${formatCurrency(r.saldoPendiente)}\n\nConsulta tu comprobante en: https://confirmacion.bgcaribe.mx/?codigo=${r.codigo}`;

  // Copiar al portapapeles con nuestro helper robusto de 3 niveles
  copyHtmlToClipboard(html, text);
}

function copyHtmlToClipboard(html, text) {
  if (navigator.clipboard && window.ClipboardItem) {
    const blobHtml = new Blob([html], { type: 'text/html' });
    const blobText = new Blob([text], { type: 'text/plain' });
    const data = [new ClipboardItem({
      'text/html': blobHtml,
      'text/plain': blobText
    })];
    navigator.clipboard.write(data).then(() => {
      showToast('Plantilla de correo copiada (HTML enriquecido)', 'success');
    }).catch(err => {
      console.warn('Clipboard write failure, trying fallback:', err);
      fallbackCopy(html, text);
    });
  } else {
    fallbackCopy(html, text);
  }
}

function fallbackCopy(html, text) {
  const listener = function(e) {
    e.clipboardData.setData('text/html', html);
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
  };
  document.addEventListener('copy', listener);
  const success = document.execCommand('copy');
  document.removeEventListener('copy', listener);
  
  if (success) {
    showToast('Plantilla copiada (HTML enriquecido mediante fallback)', 'success');
  } else {
    // Ultimo fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const txtSuccess = document.execCommand('copy');
    document.body.removeChild(ta);
    if (txtSuccess) {
      showToast('Plantilla copiada (formato texto plano)', 'info');
    } else {
      showToast('Error al copiar la plantilla', 'error');
    }
  }
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
