/* ============================================================
   BG CARIBE — Portal de Consulta de Reservaciones
   Client Logic  |  consulta.js  |  Supabase
   ============================================================ */

(function () {
  'use strict';

  /* ---------- DOM References ---------- */
  const searchForm    = document.getElementById('searchForm');
  const codigoInput   = document.getElementById('codigoInput');
  const btnSearch     = document.getElementById('btnSearch');
  const btnPrint      = document.getElementById('btnPrint');
  const stateLoading  = document.getElementById('stateLoading');
  const stateFound    = document.getElementById('stateFound');
  const stateNotFound = document.getElementById('stateNotFound');
  const stateError    = document.getElementById('stateError');

  /* ---------- Spanish month names ---------- */
  const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  /* ==========================================================
     UTILITY FUNCTIONS
     ========================================================== */

  /**
   * Format a number as Mexican currency: $XX,XXX.XX MXN
   */
  function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '—';
    return '$' + Number(amount).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' MXN';
  }

  /**
   * Format a date string (YYYY-MM-DD or ISO) into Spanish: "15 de junio de 2026"
   */
  function formatDate(dateInput) {
    if (!dateInput) return '—';

    var d;

    if (typeof dateInput === 'string') {
      // Handle YYYY-MM-DD without timezone shift
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        var parts = dateInput.split('-');
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      return String(dateInput);
    }

    if (isNaN(d.getTime())) return String(dateInput);

    return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /**
   * Return an object { label, className, icon } for a reservation status.
   */
  function getStatusLabel(status) {
    if (!status) return { label: 'Sin estado', className: 'status-pendiente', icon: 'fa-circle-question' };

    var s = String(status).toLowerCase().trim();

    if (s === 'confirmada' || s === 'confirmado') {
      return { label: 'Confirmada', className: 'status-confirmada', icon: 'fa-circle-check' };
    }
    if (s === 'cancelada' || s === 'cancelado') {
      return { label: 'Cancelada', className: 'status-cancelada', icon: 'fa-circle-xmark' };
    }
    // Default: pendiente
    return { label: 'Pendiente', className: 'status-pendiente', icon: 'fa-clock' };
  }

  /**
   * Safely read a value or return a fallback.
   */
  function safeVal(val, fallback) {
    if (val === null || val === undefined || val === '') return fallback || '—';
    return val;
  }

  /* ==========================================================
     STATE MANAGEMENT
     ========================================================== */

  function hideAllStates() {
    stateLoading.classList.add('hidden');
    stateFound.classList.add('hidden');
    stateNotFound.classList.add('hidden');
    stateError.classList.add('hidden');
  }

  function showLoading() {
    hideAllStates();
    stateLoading.classList.remove('hidden');
  }

  function showResult(data) {
    hideAllStates();
    renderReservation(data);
    stateFound.classList.remove('hidden');
  }

  function showNotFound() {
    hideAllStates();
    stateNotFound.classList.remove('hidden');
  }

  function showError() {
    hideAllStates();
    stateError.classList.remove('hidden');
  }

  /* ==========================================================
     RENDER RESERVATION DATA
     ========================================================== */

  function renderReservation(data) {
    // Code & Status
    document.getElementById('resCodeText').textContent = safeVal(data.codigo);

    var statusInfo = getStatusLabel(data.estado);
    var badgeEl = document.getElementById('resStatusBadge');
    badgeEl.innerHTML =
      '<span class="status-badge ' + statusInfo.className + '">' +
        '<i class="fa-solid ' + statusInfo.icon + '"></i> ' +
        statusInfo.label +
      '</span>';

    // Datos del Titular
    document.getElementById('resNombre').textContent    = safeVal(data.cliente_nombre);
    document.getElementById('resEmail').textContent     = safeVal(data.cliente_email);
    document.getElementById('resTelefono').textContent  = safeVal(data.cliente_telefono);
    document.getElementById('resCiudad').textContent    = safeVal(data.cliente_ciudad);

    // Detalles del Viaje
    document.getElementById('resDestino').textContent     = safeVal(data.destino);
    document.getElementById('resHotel').textContent       = safeVal(data.hotel);
    document.getElementById('resHabitacion').textContent   = safeVal(data.tipo_habitacion);
    document.getElementById('resFechaSalida').textContent  = formatDate(data.fecha_entrada);
    document.getElementById('resFechaRegreso').textContent = formatDate(data.fecha_salida);
    document.getElementById('resAdultos').textContent      = safeVal(data.adultos, '0');
    document.getElementById('resNinos').textContent        = safeVal(data.ninos, '0');

    // Boolean fields: vuelo & traslados
    var vueloEl = document.getElementById('resVuelo');
    if (data.vuelo_incluido === true) {
      vueloEl.innerHTML = '<span class="included-yes"><i class="fa-solid fa-check"></i> Incluido</span>';
    } else {
      vueloEl.innerHTML = '<span class="included-no"><i class="fa-solid fa-minus"></i> No incluido</span>';
    }

    var trasladosEl = document.getElementById('resTraslados');
    if (data.traslados_incluidos === true) {
      trasladosEl.innerHTML = '<span class="included-yes"><i class="fa-solid fa-check"></i> Incluidos</span>';
    } else {
      trasladosEl.innerHTML = '<span class="included-no"><i class="fa-solid fa-minus"></i> No incluidos</span>';
    }

    // Informacion Financiera
    var montoTotal = Number(data.monto_total || 0);
    var anticipo   = Number(data.anticipo || 0);
    var saldo      = data.saldo_pendiente !== undefined && data.saldo_pendiente !== null
                     ? Number(data.saldo_pendiente)
                     : (montoTotal - anticipo);

    document.getElementById('resMontoTotal').textContent = formatCurrency(montoTotal);
    document.getElementById('resAnticipo').textContent   = formatCurrency(anticipo);
    document.getElementById('resSaldo').textContent      = formatCurrency(saldo);
    document.getElementById('resMetodoPago').textContent  = safeVal(data.metodo_pago);
  }

  /* ==========================================================
     SUPABASE QUERY
     ========================================================== */

  async function searchReservation(code) {
    if (!code) return;

    var cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    showLoading();
    btnSearch.disabled = true;

    try {
      const { data, error } = await db
        .from('reservas')
        .select('*')
        .eq('codigo', cleanCode)
        .limit(1);

      btnSearch.disabled = false;

      if (error) {
        console.error('Error al consultar la reservación:', error);
        showError();
        return;
      }

      if (!data || data.length === 0) {
        showNotFound();
        return;
      }

      var record = data[0];
      // Ensure code is present in data
      if (!record.codigo) record.codigo = cleanCode;

      showResult(record);

    } catch (err) {
      console.error('Error al consultar la reservación:', err);
      btnSearch.disabled = false;
      showError();
    }
  }

  /* ==========================================================
     PRINT
     ========================================================== */

  function printReservation() {
    window.print();
  }

  /* ==========================================================
     EVENT LISTENERS
     ========================================================== */

  // Form submit
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = codigoInput.value.trim();
    if (!code) {
      codigoInput.focus();
      return;
    }
    searchReservation(code);
  });

  // Auto-uppercase while typing
  codigoInput.addEventListener('input', function () {
    var pos = this.selectionStart;
    this.value = this.value.toUpperCase();
    this.setSelectionRange(pos, pos);
  });

  // Print button
  if (btnPrint) {
    btnPrint.addEventListener('click', printReservation);
  }

  /* ==========================================================
     URL PARAMETER: Auto-search on page load
     ========================================================== */

  (function checkUrlParam() {
    var params = new URLSearchParams(window.location.search);
    var codigo = params.get('codigo') || params.get('code') || params.get('c');
    if (codigo) {
      codigo = codigo.trim().toUpperCase();
      codigoInput.value = codigo;
      // Small delay to let Supabase initialize
      setTimeout(function () {
        searchReservation(codigo);
      }, 600);
    }
  })();

})();
