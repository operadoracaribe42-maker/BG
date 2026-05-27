/* ============================================================
   BG CARIBE — Portal de Confirmación de Reservaciones
   Client Logic  |  confirmacion.js  |  Supabase
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
    if (!status) return { label: 'Sin estado', className: 'badge-pendiente', icon: 'fa-clock' };

    var s = String(status).toLowerCase().trim();

    if (s === 'confirmada' || s === 'confirmado') {
      return { label: 'Confirmada', className: 'badge-confirmada', icon: 'fa-circle-check' };
    }
    if (s === 'cancelada' || s === 'cancelado') {
      return { label: 'Cancelada', className: 'badge-cancelada', icon: 'fa-circle-xmark' };
    }
    // Default: pendiente
    return { label: 'Pendiente', className: 'badge-pendiente', icon: 'fa-clock' };
  }

  /**
   * Safely read a value or return a fallback.
   */
  function safeVal(val, fallback) {
    if (val === null || val === undefined || val === '') return fallback || '—';
    return val;
  }

  /**
   * Safely escape HTML characters.
   */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
    document.getElementById('resFechaEmision').textContent = formatDate(data.creado_en || new Date());

    var statusInfo = getStatusLabel(data.estado);
    var badgeEl = document.getElementById('resStatusBadge');
    badgeEl.innerHTML =
      '<span class="badge ' + statusInfo.className + '">' +
        '<i class="fa-solid ' + statusInfo.icon + '"></i> ' +
        statusInfo.label +
      '</span>';

    // Datos del Titular
    document.getElementById('resNombre').textContent    = safeVal(data.cliente_nombre);
    document.getElementById('resEmail').textContent     = safeVal(data.cliente_email);
    document.getElementById('resTelefono').textContent  = safeVal(data.cliente_telefono);
    document.getElementById('resCiudad').textContent    = safeVal(data.cliente_ciudad);

    // Renderizar Acompañantes / Huéspedes
    var huespedesListEl = document.getElementById('resHuespedesList');
    var sectionHuespedes = document.getElementById('sectionHuespedes');
    huespedesListEl.innerHTML = '';
    
    var huespedes = [];
    try {
      if (data.nombres_huespedes) {
        huespedes = JSON.parse(data.nombres_huespedes);
      }
    } catch(e) {
      huespedes = data.nombres_huespedes ? data.nombres_huespedes.split(',').map(function(n) { return n.trim(); }) : [];
    }

    var edades = [];
    try {
      if (data.edades_ninos) {
        edades = JSON.parse(data.edades_ninos);
      }
    } catch(e) {
      edades = data.edades_ninos ? data.edades_ninos.split(',').map(function(n) { return parseInt(n.trim()) || 0; }) : [];
    }

    if (huespedes && huespedes.length > 0) {
      sectionHuespedes.style.display = 'block';
      huespedes.forEach(function (name, index) {
        var div = document.createElement('div');
        div.className = 'huesped-item';
        
        var suffix = '';
        if (index === 0) {
          suffix = ' <strong>(Titular)</strong>';
        } else if (index >= Number(data.adultos || 1)) {
          var childIdx = index - Number(data.adultos || 1);
          var age = edades[childIdx];
          if (age !== undefined && age !== null && age !== '') {
            suffix = ' <span>(' + age + ' años)</span>';
          } else {
            suffix = ' <span>(Niño)</span>';
          }
        }
        
        div.innerHTML = '<i class="fa-solid fa-circle-user"></i> ' + escapeHtml(name) + suffix;
        huespedesListEl.appendChild(div);
      });
    } else {
      sectionHuespedes.style.display = 'none';
    }

    // Detalles del Viaje
    document.getElementById('resDestino').textContent     = safeVal(data.destino);
    document.getElementById('resHotel').textContent       = safeVal(data.hotel);
    document.getElementById('resHabitacion').textContent   = safeVal(data.tipo_habitacion);
    document.getElementById('resPlanAlimentos').textContent = safeVal(data.plan_alimentos, 'Solo Habitación');
    document.getElementById('resFechaEntrada').textContent = formatDate(data.fecha_entrada);
    document.getElementById('resFechaSalida').textContent  = formatDate(data.fecha_salida);
    
    // Noches de estadía
    var nochesText = '—';
    if (data.cantidad_noches !== undefined && data.cantidad_noches !== null) {
      nochesText = data.cantidad_noches + ' noche' + (Number(data.cantidad_noches) !== 1 ? 's' : '');
    } else if (data.fecha_entrada && data.fecha_salida) {
      var ent = new Date(data.fecha_entrada + 'T00:00:00');
      var sal = new Date(data.fecha_salida + 'T00:00:00');
      var diff = sal - ent;
      if (diff > 0) {
        var nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
        nochesText = nights + ' noche' + (nights !== 1 ? 's' : '');
      }
    }
    document.getElementById('resNoches').textContent = nochesText;

    document.getElementById('resAdultos').textContent      = safeVal(data.adultos, '0');
    document.getElementById('resNinos').textContent        = safeVal(data.ninos, '0');
    document.getElementById('resAgenteNombre').textContent = safeVal(data.agente_nombre, 'Asignado automáticamente');

    // Detalles Adicionales (Vuelos y Traslados)
    var sectionAdicionales = document.getElementById('sectionAdicionales');
    var itemVueloIda = document.getElementById('itemVueloIda');
    var itemVueloVuelta = document.getElementById('itemVueloVuelta');
    var itemTipoTraslado = document.getElementById('itemTipoTraslado');
    var showAdicionales = false;

    if (data.vuelo_incluido === true && (data.vuelo_ida || data.vuelo_vuelta)) {
      showAdicionales = true;
      if (data.vuelo_ida) {
        itemVueloIda.style.display = 'block';
        document.getElementById('resVueloIda').textContent = data.vuelo_ida;
      } else {
        itemVueloIda.style.display = 'none';
      }
      if (data.vuelo_vuelta) {
        itemVueloVuelta.style.display = 'block';
        document.getElementById('resVueloVuelta').textContent = data.vuelo_vuelta;
      } else {
        itemVueloVuelta.style.display = 'none';
      }
    } else {
      itemVueloIda.style.display = 'none';
      itemVueloVuelta.style.display = 'none';
    }

    if (data.traslados_incluidos === true && data.tipo_traslado) {
      showAdicionales = true;
      itemTipoTraslado.style.display = 'block';
      document.getElementById('resTipoTraslado').textContent = data.tipo_traslado;
    } else {
      itemTipoTraslado.style.display = 'none';
    }

    if (showAdicionales) {
      sectionAdicionales.style.display = 'block';
    } else {
      sectionAdicionales.style.display = 'none';
    }

    // Solicitudes Especiales
    var sectionPeticiones = document.getElementById('sectionPeticiones');
    if (data.peticiones_especiales) {
      sectionPeticiones.style.display = 'block';
      document.getElementById('resPeticiones').textContent = data.peticiones_especiales;
    } else {
      sectionPeticiones.style.display = 'none';
    }

    // Renderizar Parques Incluidos
    var parquesListEl = document.getElementById('resParquesList');
    var sectionParques = document.getElementById('sectionParques');
    parquesListEl.innerHTML = '';

    var parques = [];
    try {
      if (data.parques_incluidos) {
        parques = JSON.parse(data.parques_incluidos);
      }
    } catch(e) {
      parques = data.parques_incluidos ? data.parques_incluidos.split(',').map(function(p) { return p.trim(); }) : [];
    }

    if (parques && parques.length > 0) {
      sectionParques.style.display = 'block';
      parques.forEach(function (park) {
        var span = document.createElement('span');
        span.className = 'park-badge';
        span.innerHTML = '<i class="fa-solid fa-ticket"></i> ' + escapeHtml(park);
        parquesListEl.appendChild(span);
      });
    } else {
      sectionParques.style.display = 'none';
    }

    // Boolean fields: vuelo & traslados
    var vueloEl = document.getElementById('resVuelo');
    if (data.vuelo_incluido === true) {
      vueloEl.innerHTML = '<span class="included-yes" style="color:var(--primary); font-weight:600;"><i class="fa-solid fa-check"></i> Incluido</span>';
    } else {
      vueloEl.innerHTML = '<span class="included-no" style="color:var(--text-light);"><i class="fa-solid fa-minus"></i> No incluido</span>';
    }

    var trasladosEl = document.getElementById('resTraslados');
    if (data.traslados_incluidos === true) {
      trasladosEl.innerHTML = '<span class="included-yes" style="color:var(--primary); font-weight:600;"><i class="fa-solid fa-check"></i> Incluidos</span>';
    } else {
      trasladosEl.innerHTML = '<span class="included-no" style="color:var(--text-light);"><i class="fa-solid fa-minus"></i> No incluidos</span>';
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
      setTimeout(function () {
        searchReservation(codigo);
      }, 600);
    }
  })();

})();
