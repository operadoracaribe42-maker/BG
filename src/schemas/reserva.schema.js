/**
 * Schema Definition for ReservaData
 * 
 * @typedef {Object} Huesped
 * @property {string} nombre
 * @property {boolean} esTitular
 * @property {number} [edad]
 * @property {string} [idTipo]
 * @property {string} [idNum]
 * 
 * @typedef {Object} ReservaData
 * // Grupo 1: Meta
 * @property {string} codigoReserva
 * @property {string} fechaEmision
 * @property {string} nombreAsesor
 * @property {'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA'} estado
 * 
 * // Grupo 2: Titular
 * @property {string} titularNombre
 * @property {string} titularEmail
 * @property {string} titularTelefono
 * @property {string} titularCiudad
 * @property {string} titularDireccion
 * @property {string} titularCP
 * @property {string} [titularRFC]
 * @property {'INE' | 'Pasaporte' | 'Otro'} titularIdTipo
 * @property {string} titularIdNum
 * 
 * // Grupo 3: Acompañantes
 * @property {Huesped[]} huespedes
 * 
 * // Grupo 4: Viaje
 * @property {string} destino
 * @property {string} hotel
 * @property {string} tipoHabitacion
 * @property {string} planAlimentos
 * @property {string} fechaEntrada
 * @property {string} fechaSalida
 * @property {number} noches
 * @property {number} numAdultos
 * @property {number} numNinos
 * @property {boolean} vueloIncluido
 * @property {string} [origenVuelo]
 * @property {string} [vueloIda]
 * @property {string} [vueloRegreso]
 * @property {string} [aerolinea]
 * @property {boolean} traslados
 * @property {string} tipoTraslado
 * @property {string[]} parquesIncluidos
 * @property {string} [serviciosAdicionales]
 * @property {string} [notasEspeciales]
 * 
 * // Grupo 5: Financiero
 * @property {number} totalPaquete
 * @property {number} porcentajeAnticipo
 * @property {number} anticipo
 * @property {number} saldoPendiente
 * @property {string} metodoPago
 * @property {string} fechaLimitePago
 * @property {string} [referenciaPago]
 * 
 * // Grupo 6: Facturación
 * @property {boolean} requiereFactura
 * @property {string} [facturaRazonSocial]
 * @property {string} [facturaRFC]
 * @property {string} [facturaUsoCFDI]
 * @property {string} [facturaDomicilio]
 * @property {string} [facturaCp]
 * @property {string} [facturaRegimen]
 */

/**
 * Genera un código de reserva aleatorio con formato BG-XXXXXXXX
 * @returns {string}
 */
function generarCodigoReserva() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BG-';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

module.exports = {
  generarCodigoReserva
};
