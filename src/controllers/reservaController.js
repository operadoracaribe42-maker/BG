const { generarCodigoReserva } = require('../schemas/reserva.schema');
const { renderTemplate } = require('../services/templateEngine');
const { generatePDFBuffer, savePDF } = require('../services/pdfGenerator');
const { sendReservationEmails } = require('../services/emailService');

/**
 * Controller to handle confirming a reservation, rendering PDFs and sending emails.
 * 
 * @param {import('../schemas/reserva.schema').ReservaData} input 
 * @returns {Promise<{
 *   success: boolean;
 *   codigoReserva: string;
 *   rutaVoucher: string;
 *   rutaContrato: string;
 *   emailClienteOk: boolean;
 *   emailInternoOk: boolean;
 *   error?: string;
 * }>}
 */
async function confirmarReserva(input) {
  try {
    // 1. VALIDAR campos obligatorios
    const requiredFields = [
      { key: 'titularNombre', label: 'Nombre del titular' },
      { key: 'titularEmail', label: 'Correo electrónico del titular' },
      { key: 'titularTelefono', label: 'Teléfono del titular' },
      { key: 'fechaEntrada', label: 'Fecha de entrada' },
      { key: 'fechaSalida', label: 'Fecha de salida' },
      { key: 'hotel', label: 'Hotel' }
    ];

    for (let field of requiredFields) {
      if (!input[field.key] || String(input[field.key]).trim() === '') {
        return {
          success: false,
          error: `Campo ${field.label} requerido`,
          codigoReserva: '',
          rutaVoucher: '',
          rutaContrato: '',
          emailClienteOk: false,
          emailInternoOk: false
        };
      }
    }

    if (input.totalPaquete === undefined || input.totalPaquete === null || isNaN(Number(input.totalPaquete)) || Number(input.totalPaquete) <= 0) {
      return {
        success: false,
        error: 'El total del paquete debe ser un número mayor a 0',
        codigoReserva: '',
        rutaVoucher: '',
        rutaContrato: '',
        emailClienteOk: false,
        emailInternoOk: false
      };
    }

    // Clone input data to avoid mutating original
    const data = { ...input };

    // 2. COMPLETAR campos calculados
    if (!data.codigoReserva || String(data.codigoReserva).trim() === '') {
      data.codigoReserva = generarCodigoReserva();
    }
    if (!data.fechaEmision || String(data.fechaEmision).trim() === '') {
      data.fechaEmision = new Date().toISOString();
    }
    
    // Calculate nights if not provided
    if (data.noches === undefined || data.noches === null || isNaN(Number(data.noches))) {
      const ent = new Date(data.fechaEntrada);
      const sal = new Date(data.fechaSalida);
      const diff = sal.getTime() - ent.getTime();
      if (diff > 0) {
        data.noches = Math.ceil(diff / (1000 * 60 * 60 * 24));
      } else {
        data.noches = 0;
      }
    }

    // Default porcentajeAnticipo to 30 if not defined
    if (data.porcentajeAnticipo === undefined || data.porcentajeAnticipo === null || isNaN(Number(data.porcentajeAnticipo))) {
      data.porcentajeAnticipo = 30;
    }

    // Calculate anticipo and saldoPendiente if not provided
    if (data.anticipo === undefined || data.anticipo === null || isNaN(Number(data.anticipo))) {
      data.anticipo = Number(data.totalPaquete) * (Number(data.porcentajeAnticipo) / 100);
    }
    if (data.saldoPendiente === undefined || data.saldoPendiente === null || isNaN(Number(data.saldoPendiente))) {
      data.saldoPendiente = Number(data.totalPaquete) - Number(data.anticipo);
    }

    // 3. RENDERIZAR el HTML del voucher
    const voucherHTML = renderTemplate('./templates/voucher_bgcaribe.html', data);
    
    // 4. RENDERIZAR el HTML del contrato
    const contratoHTML = renderTemplate('./templates/contrato_bgcaribe.html', data);

    // 5. GENERAR ambos PDFs EN PARALELO
    const [voucherBuffer, contratoBuffer] = await Promise.all([
      generatePDFBuffer(voucherHTML),
      generatePDFBuffer(contratoHTML)
    ]);

    // 6. GUARDAR los PDFs (passing buffers to optimize)
    const rutaVoucher = await savePDF(voucherBuffer, 'voucher', data.codigoReserva, data.fechaEmision);
    const rutaContrato = await savePDF(contratoBuffer, 'contrato', data.codigoReserva, data.fechaEmision);

    // 7. ENVIAR correos
    const emailResult = await sendReservationEmails(data, voucherBuffer, contratoBuffer)
      .catch((err) => {
        console.error('Error en sendReservationEmails:', err);
        return { clienteOk: false, internoOk: false };
      });

    return {
      success: true,
      codigoReserva: data.codigoReserva,
      rutaVoucher,
      rutaContrato,
      emailClienteOk: emailResult.clienteOk,
      emailInternoOk: emailResult.internoOk
    };

  } catch (error) {
    console.error('Error inesperado en confirmarReserva:', error);
    return {
      success: false,
      error: error.message,
      codigoReserva: '',
      rutaVoucher: '',
      rutaContrato: '',
      emailClienteOk: false,
      emailInternoOk: false
    };
  }
}

module.exports = {
  confirmarReserva
};
