const fs = require('fs');

/**
 * Escapes HTML string for security
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats date into Spanish format: "26 de mayo de 2026"
 */
function formatDateSpanish(dateInput) {
  if (!dateInput) return '—';
  let d;
  if (typeof dateInput === 'string') {
    // Handle YYYY-MM-DD to avoid timezone shifting
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const parts = dateInput.split('-');
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
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Renders the HTML template with the given data
 * 
 * @param {string} templatePath 
 * @param {import('../schemas/reserva.schema').ReservaData} data 
 * @returns {string}
 */
function renderTemplate(templatePath, data) {
  let html = fs.readFileSync(templatePath, 'utf8');

  // Formatted date values
  const fechaEmisionFormatted = formatDateSpanish(data.fechaEmision);
  const fechaEntradaFormatted = formatDateSpanish(data.fechaEntrada);
  const fechaSalidaFormatted = formatDateSpanish(data.fechaSalida);
  const fechaLimitePagoFormatted = formatDateSpanish(data.fechaLimitePago);

  // Format currency helper
  const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '$0.00';
    return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalPaqueteFormatted = formatCurrency(data.totalPaquete);
  const anticipoFormatted = formatCurrency(data.anticipo);
  const saldoPendienteFormatted = formatCurrency(data.saldoPendiente);

  // Build vars map
  const vars = {
    '{{CODIGO_RESERVA}}': data.codigoReserva || '',
    '{{FECHA_EMISION}}': fechaEmisionFormatted,
    '{{NOMBRE_ASESOR}}': data.nombreAsesor || '',
    '{{TITULAR_NOMBRE}}': data.titularNombre || '',
    '{{TITULAR_EMAIL}}': data.titularEmail || '',
    '{{TITULAR_TELEFONO}}': data.titularTelefono || '',
    '{{TITULAR_CIUDAD}}': data.titularCiudad || '',
    '{{TITULAR_DIRECCION}}': data.titularDireccion || '',
    '{{TITULAR_CP}}': data.titularCP || '',
    '{{TITULAR_RFC}}': data.titularRFC || 'No proporcionado',
    '{{TITULAR_ID_TIPO}}': data.titularIdTipo || '',
    '{{TITULAR_ID_NUM}}': data.titularIdNum || '',
    '{{DESTINO}}': data.destino || '',
    '{{HOTEL}}': data.hotel || '',
    '{{TIPO_HABITACION}}': data.tipoHabitacion || '',
    '{{PLAN_ALIMENTOS}}': data.planAlimentos || '',
    '{{FECHA_ENTRADA}}': fechaEntradaFormatted,
    '{{FECHA_SALIDA}}': fechaSalidaFormatted,
    '{{NOCHES}}': String(data.noches || 0),
    '{{NUM_ADULTOS}}': String(data.numAdultos || 0),
    '{{NUM_NINOS}}': String(data.numNinos || 0),
    '{{VUELO_INCLUIDO}}': data.vueloIncluido ? 'Incluido' : 'No incluido',
    '{{ORIGEN_VUELO}}': data.origenVuelo || 'N/A',
    '{{VUELO_IDA}}': data.vueloIda || 'Por confirmar',
    '{{VUELO_REGRESO}}': data.vueloRegreso || 'Por confirmar',
    '{{AEROLINEA}}': data.aerolinea || 'Por confirmar',
    '{{TRASLADOS}}': data.traslados ? 'Incluidos' : 'No incluidos',
    '{{TIPO_TRASLADO}}': data.tipoTraslado || '',
    '{{LISTA_PARQUES}}': (data.parquesIncluidos && data.parquesIncluidos.join(' · ')) || 'No aplica',
    '{{SERVICIOS_ADICIONALES}}': data.serviciosAdicionales || 'Ninguno',
    '{{NOTAS_ESPECIALES}}': data.notasEspeciales || 'Sin peticiones especiales',
    '{{TOTAL_PAQUETE}}': totalPaqueteFormatted,
    '{{ANTICIPO}}': anticipoFormatted,
    '{{SALDO_PENDIENTE}}': saldoPendienteFormatted,
    '{{METODO_PAGO}}': data.metodoPago || '',
    '{{FECHA_LIMITE_PAGO}}': fechaLimitePagoFormatted,
    '{{REQUIERE_FACTURA}}': data.requiereFactura ? 'Sí' : 'No',
    '{{FACTURA_RAZON_SOCIAL}}': data.facturaRazonSocial || 'No solicitada',
    '{{FACTURA_RFC}}': data.facturaRFC || 'N/A',
    '{{FACTURA_USO_CFDI}}': data.facturaUsoCFDI || 'N/A',
    '{{FACTURA_DOMICILIO}}': data.facturaDomicilio || 'N/A',
    '{{FACTURA_CP}}': data.facturaCp || 'N/A',
    '{{FACTURA_REGIMEN}}': data.facturaRegimen || 'N/A',
    '{{HUESPED_1_NOMBRE}}': (data.huespedes && data.huespedes[0] && data.huespedes[0].nombre) || data.titularNombre || ''
  };

  // Replace simple markers
  Object.entries(vars).forEach(([key, value]) => {
    html = html.replaceAll(key, value);
  });

  // Handle HUESPED_2_NOMBRE and repeat guests
  if (data.huespedes && data.huespedes[1]) {
    html = html.replaceAll('{{HUESPED_2_NOMBRE}}', data.huespedes[1].nombre);
  } else {
    // If no second guest, remove the hardcoded second guest chip entirely
    html = html.replace(/<div class="guest-chip"><span>\{\{HUESPED_2_NOMBRE\}\}<\/span><\/div>/g, '');
  }

  let repeatHuespedesHtml = '';
  if (data.huespedes && data.huespedes.length > 2) {
    // Start repeating from index 2 because index 0 is HUESPED_1 and index 1 is HUESPED_2
    for (let i = 2; i < data.huespedes.length; i++) {
      const g = data.huespedes[i];
      let suffix = '';
      if (g.edad !== undefined && g.edad !== null) {
        suffix = ` <span class="badge" style="background:#4A5E72; font-size:7px;">${g.edad} años</span>`;
      }
      repeatHuespedesHtml += `<div class="guest-chip"><span>${escapeHtml(g.nombre)}</span>${suffix}</div>\n`;
    }
  }
  html = html.replace('<!-- {{REPETIR_HUESPEDES}} -->', repeatHuespedesHtml);

  // Handle PARQUE_1, PARQUE_2 and repeat parks
  const parksList = data.parquesIncluidos || [];
  if (parksList[0]) {
    html = html.replaceAll('{{PARQUE_1}}', parksList[0]);
  } else {
    html = html.replace(/<span class="park-tag">\{\{PARQUE_1\}\}<\/span>/g, '');
  }

  if (parksList[1]) {
    html = html.replaceAll('{{PARQUE_2}}', parksList[1]);
  } else {
    html = html.replace(/<span class="park-tag">\{\{PARQUE_2\}\}<\/span>/g, '');
  }

  let repeatParquesHtml = '';
  if (parksList.length > 2) {
    for (let i = 2; i < parksList.length; i++) {
      repeatParquesHtml += `<span class="park-tag">${escapeHtml(parksList[i])}</span>\n`;
    }
  }
  html = html.replace('<!-- {{REPETIR_PARQUES}} -->', repeatParquesHtml);

  return html;
}

module.exports = {
  renderTemplate,
  formatDateSpanish
};
