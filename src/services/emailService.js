const nodemailer = require('nodemailer');
const { buildEmailHTML } = require('./emailTemplate');

/**
 * Envia correos de confirmacion al cliente e internos
 * 
 * @param {import('../schemas/reserva.schema').ReservaData} data 
 * @param {Buffer} voucherPdfBuffer 
 * @param {Buffer} contratoPdfBuffer 
 * @returns {Promise<{ clienteOk: boolean; internoOk: boolean }>}
 */
async function sendReservationEmails(data, voucherPdfBuffer, contratoPdfBuffer) {
  const isSecure = process.env.EMAIL_SECURE === 'true';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const code = data.codigoReserva;
  
  let clienteOk = false;
  let internoOk = false;

  // 1. Correo al CLIENTE
  try {
    const mailOptionsCliente = {
      from: process.env.EMAIL_FROM || '"BG Caribe" <reservaciones@bgcaribe.mx>',
      to: data.titularEmail,
      subject: `Confirmación de Reserva ${code} — BG Caribe`,
      html: buildEmailHTML(data),
      attachments: [
        {
          filename: `voucher_${code}.pdf`,
          content: voucherPdfBuffer
        },
        {
          filename: `contrato_${code}.pdf`,
          content: contratoPdfBuffer
        }
      ]
    };

    const info = await transporter.sendMail(mailOptionsCliente);
    console.log('Correo cliente enviado con éxito:', info.messageId);
    clienteOk = true;
  } catch (error) {
    console.error('Error al enviar correo al cliente:', error);
  }

  // 2. Correo INTERNO
  try {
    const textInterno = `
[NUEVA RESERVA REGISTRADA]
-----------------------------------------
Código de Reserva:     ${code}
Asesor:                ${data.nombreAsesor || 'Asignado'}
Estado:                ${data.estado}

DATOS DEL TITULAR:
Nombre completo:       ${data.titularNombre}
Correo electrónico:    ${data.titularEmail}
Teléfono / WhatsApp:   ${data.titularTelefono}
Ciudad:                ${data.titularCiudad}
Dirección:             ${data.titularDireccion}, C.P. ${data.titularCP}
RFC:                   ${data.titularRFC || 'N/A'}
Identificación:        ${data.titularIdTipo} No. ${data.titularIdNum}

DETALLES DEL VIAJE:
Destino:               ${data.destino}
Hotel / Resort:        ${data.hotel}
Tipo de Habitación:    ${data.tipoHabitacion}
Plan de Alimentos:     ${data.planAlimentos}
Fecha de Entrada:      ${data.fechaEntrada}
Fecha de Salida:       ${data.fechaSalida}
Noches:                ${data.noches}
Huéspedes:             ${data.numAdultos} adulto(s) · ${data.numNinos} niño(s)
Vuelo Incluido:        ${data.vueloIncluido ? 'Sí' : 'No'}
Aerolínea / Ida / Reg: ${data.aerolinea || 'N/A'} / ${data.vueloIda || 'N/A'} / ${data.vueloRegreso || 'N/A'}
Traslados Incluidos:   ${data.traslados ? 'Sí' : 'No'} (${data.tipoTraslado || 'N/A'})
Parques Incluidos:     ${(data.parquesIncluidos && data.parquesIncluidos.join(', ')) || 'Ninguno'}

INFORMACIÓN FINANCIERA:
Monto Total Paquete:   $${data.totalPaquete.toFixed(2)} MXN
Anticipo Recibido:     $${data.anticipo.toFixed(2)} MXN
Saldo Pendiente:       $${data.saldoPendiente.toFixed(2)} MXN
Método de Pago:        ${data.metodoPago}
Fecha Límite Pago:     ${data.fechaLimitePago}
Referencia Pago:       ${data.referenciaPago || 'N/A'}

FACTURACIÓN:
¿Requiere factura?:    ${data.requiereFactura ? 'Sí' : 'No'}
Razón Social Fiscal:   ${data.facturaRazonSocial || 'N/A'}
RFC Fiscal:            ${data.facturaRFC || 'N/A'}
Uso CFDI:              ${data.facturaUsoCFDI || 'N/A'}
Régimen Fiscal:        ${data.facturaRegimen || 'N/A'}
Domicilio Fiscal/CP:   ${data.facturaDomicilio || 'N/A'} / ${data.facturaCp || 'N/A'}
`;

    const mailOptionsInterno = {
      from: process.env.EMAIL_FROM || '"BG Caribe" <reservaciones@bgcaribe.mx>',
      to: process.env.EMAIL_INTERNO || 'reservaciones@bgcaribe.mx',
      subject: `[NUEVA RESERVA] ${code} — ${data.titularNombre} — ${data.hotel}`,
      text: textInterno,
      attachments: [
        {
          filename: `voucher_${code}.pdf`,
          content: voucherPdfBuffer
        },
        {
          filename: `contrato_${code}.pdf`,
          content: contratoPdfBuffer
        }
      ]
    };

    const info = await transporter.sendMail(mailOptionsInterno);
    console.log('Correo interno enviado con éxito:', info.messageId);
    internoOk = true;
  } catch (error) {
    console.error('Error al enviar correo interno:', error);
  }

  return { clienteOk, internoOk };
}

module.exports = {
  sendReservationEmails
};
