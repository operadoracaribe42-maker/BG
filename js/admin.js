/*
========================================================================
   BG CARIBE — ADMIN PANEL JAVASCRIPT
   Lógica completa del panel de administración
   Firebase Firestore · Tiempo real · CRUD de reservaciones
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

const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/* ══════════════════════════════════════════════════════════════════════
   2.  STATE
   ══════════════════════════════════════════════════════════════════════ */
let allReservations = [];
let deleteTargetId = null;
let deleteTargetCode = null;
let unsubscribeListener = null;

/* ══════════════════════════════════════════════════════════════════════
   3.  DOM REFERENCES
   ══════════════════════════════════════════════════════════════════════ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══════════════════════════════════════════════════════════════════════
   4.  INITIALIZATION
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  if (sessionStorage.getItem('bgAdmin') === 'true') {
    showDashboard();
  }

  initLoginForm();
  initSidebar();
  initReservationForm();
  initFilters();
  initEditFormListeners();
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

  // Logout
  $('#btnLogout').addEventListener('click', logout);
}

function showDashboard() {
  $('#loginScreen').classList.add('hidden');
  $('#adminDashboard').classList.add('active');
  loadReservations();
}

function logout() {
  sessionStorage.removeItem('bgAdmin');
  if (unsubscribeListener) {
    unsubscribeListener();
    unsubscribeListener = null;
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
  // Destino → Hotel dynamic update
  $('#destino').addEventListener('change', () => {
    updateHotelOptions('destino', 'hotel');
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
      const formData = gatherFormData();
      const code = await generateReservationCode();
      formData.codigo = code;
      formData.estado = 'pendiente';
      formData.creadoEn = firebase.firestore.FieldValue.serverTimestamp();
      formData.actualizadoEn = firebase.firestore.FieldValue.serverTimestamp();

      await reservasRef.add(formData);

      // Show success modal
      $('#successCode').textContent = code;
      openModal('successModal');
      showToast('Reservación creada exitosamente', 'success');

      // Reset form
      $('#reservationForm').reset();
      $('#saldoPendiente').textContent = '$0.00 MXN';
      updateHotelOptions('destino', 'hotel');

    } catch (error) {
      console.error('Error al crear reservación:', error);
      showToast('Error al crear la reservación: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-ticket"></i> Generar Reserva';
    }
  });
}

function gatherFormData() {
  const monto = parseFloat($('#montoTotal').value) || 0;
  const anticipo = parseFloat($('#anticipo').value) || 0;

  return {
    clienteNombre:    $('#clienteNombre').value.trim(),
    clienteEmail:     $('#clienteEmail').value.trim(),
    clienteTelefono:  $('#clienteTelefono').value.trim(),
    clienteCiudad:    $('#clienteCiudad').value.trim(),
    destino:          $('#destino').value,
    hotel:            $('#hotel').value,
    tipoHabitacion:   $('#tipoHabitacion').value,
    fechaEntrada:     $('#fechaEntrada').value,
    fechaSalida:      $('#fechaSalida').value,
    adultos:          parseInt($('#adultos').value) || 1,
    ninos:            parseInt($('#ninos').value) || 0,
    vueloIncluido:    $('#vueloIncluido').checked,
    trasladosIncluidos: $('#trasladosIncluidos').checked,
    montoTotal:       monto,
    anticipo:         anticipo,
    saldoPendiente:   monto - anticipo,
    metodoPago:       $('#metodoPago').value,
    notas:            $('#notas').value.trim()
  };
}

/* ══════════════════════════════════════════════════════════════════════
   8.  DYNAMIC HOTEL OPTIONS
   ══════════════════════════════════════════════════════════════════════ */
function updateHotelOptions(destinoSelectId, hotelSelectId) {
  const destino = $(`#${destinoSelectId}`).value;
  const hotelSelect = $(`#${hotelSelectId}`);
  hotelSelect.innerHTML = '';

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
    // Check uniqueness in Firestore
    const snapshot = await reservasRef.where('codigo', '==', code).get();
    if (snapshot.empty) {
      unique = true;
    }
  }

  return code;
}

/* ══════════════════════════════════════════════════════════════════════
   11.  FIRESTORE — LOAD RESERVATIONS (REAL-TIME)
   ══════════════════════════════════════════════════════════════════════ */
function loadReservations() {
  if (unsubscribeListener) {
    unsubscribeListener();
  }

  unsubscribeListener = reservasRef
    .orderBy('creadoEn', 'desc')
    .onSnapshot((snapshot) => {
      allReservations = [];
      snapshot.forEach((doc) => {
        allReservations.push({ id: doc.id, ...doc.data() });
      });
      updateStats(allReservations);
      filterReservations();
      renderDashboardTable(allReservations.slice(0, 5));
    }, (error) => {
      console.error('Error en listener de reservaciones:', error);
      showToast('Error al cargar reservaciones', 'error');
    });
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
  // Dynamic hotel options for edit form
  $('#editDestino').addEventListener('change', () => {
    updateHotelOptions('editDestino', 'editHotel');
  });

  // Saldo calculation for edit form
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
  updateHotelOptions('editDestino', 'editHotel');
  // Need a small delay to ensure options are rendered
  setTimeout(() => {
    $('#editHotel').value = reservation.hotel || '';
  }, 10);

  $('#editTipoHabitacion').value = reservation.tipoHabitacion || 'Estándar';
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

  openModal('editModal');
}

async function saveEdit() {
  const docId = $('#editDocId').value;
  if (!docId) return;

  const btn = $('#btnGuardarEdicion');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Guardando...';

  const editMonto = parseFloat($('#editMonto').value) || 0;
  const editAnticipo = parseFloat($('#editAnticipo').value) || 0;

  const updatedData = {
    estado:             $('#editEstado').value,
    clienteNombre:      $('#editNombre').value.trim(),
    clienteEmail:       $('#editEmail').value.trim(),
    clienteTelefono:    $('#editTelefono').value.trim(),
    clienteCiudad:      $('#editCiudad').value.trim(),
    destino:            $('#editDestino').value,
    hotel:              $('#editHotel').value,
    tipoHabitacion:     $('#editTipoHabitacion').value,
    fechaEntrada:       $('#editFechaEntrada').value,
    fechaSalida:        $('#editFechaSalida').value,
    adultos:            parseInt($('#editAdultos').value) || 1,
    ninos:              parseInt($('#editNinos').value) || 0,
    vueloIncluido:      $('#editVuelo').checked,
    trasladosIncluidos: $('#editTraslados').checked,
    montoTotal:         editMonto,
    anticipo:           editAnticipo,
    saldoPendiente:     editMonto - editAnticipo,
    metodoPago:         $('#editMetodoPago').value,
    notas:              $('#editNotas').value.trim(),
    actualizadoEn:      firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await reservasRef.doc(docId).update(updatedData);
    closeModal('editModal');
    showToast('Reservación actualizada exitosamente', 'success');
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
    await reservasRef.doc(deleteTargetId).delete();
    closeModal('deleteModal');
    showToast(`Reservación ${deleteTargetCode} eliminada`, 'success');
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
   17.  MODALS
   ══════════════════════════════════════════════════════════════════════ */
function openModal(modalId) {
  $(`#${modalId}`).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  $(`#${modalId}`).classList.remove('active');
  document.body.style.overflow = '';
}

// Close on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

/* ══════════════════════════════════════════════════════════════════════
   18.  COPY CODE
   ══════════════════════════════════════════════════════════════════════ */
function copyCode() {
  const code = $('#successCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código copiado al portapapeles', 'success');
  }).catch(() => {
    // Fallback for older browsers
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
   19.  FORMATTING HELPERS
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
  const parts = dateString.split('-');
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
   20.  TOAST NOTIFICATIONS
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

  // Auto-remove after 4s
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
