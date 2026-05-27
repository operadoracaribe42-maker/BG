const { formatDateSpanish } = require('./templateEngine');

/**
 * Builds the inline-styled HTML body for emails.
 * 
 * @param {import('../schemas/reserva.schema').ReservaData} data 
 * @returns {string}
 */
function buildEmailHTML(data) {
  // Format helpers
  const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '$0.00';
    return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const code = data.codigoReserva || '';
  const titularNombre = data.titularNombre || '';
  const destino = data.destino || '';
  const hotel = data.hotel || '';
  const fechaEntradaStr = formatDateSpanish(data.fechaEntrada);
  const fechaSalidaStr = formatDateSpanish(data.fechaSalida);
  const nochesStr = String(data.noches || 0);
  const adultos = String(data.numAdultos || 0);
  const ninos = String(data.numNinos || 0);
  
  const totalFormatted = formatCurrency(data.totalPaquete) + ' MXN';
  const anticipoFormatted = formatCurrency(data.anticipo) + ' MXN';
  const saldoFormatted = formatCurrency(data.saldoPendiente) + ' MXN';
  const fechaLimitePagoStr = formatDateSpanish(data.fechaLimitePago);
  const asesorNombre = data.nombreAsesor || 'Asignado';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Confirmación de Reserva ${code}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; padding: 20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0A1F33; padding: 24px 30px; text-align: left;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #FFFFFF; font-size: 20px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                    BG CARIBE
                  </td>
                  <td style="color: #8899A6; font-size: 12px; font-weight: bold; text-align: right; letter-spacing: 1px;">
                    RESERVA: ${code}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 30px; font-size: 14px; line-height: 1.6; color: #333333;">
              <p style="margin-top: 0; font-size: 16px; font-weight: bold;">Estimado/a ${titularNombre},</p>
              
              <p>Nos complace confirmar su reserva con BG Caribe. A continuación encontrará el resumen de su viaje. Los documentos completos (voucher y contrato) se adjuntan a este correo en formato PDF.</p>
              
              <!-- Resumen Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #F3F6F9; border-left: 3px solid #00818A; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="30%" style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Destino:</td>
                        <td style="padding: 4px 0; color: #111111;">${destino}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Hotel:</td>
                        <td style="padding: 4px 0; color: #111111;">${hotel}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Entrada:</td>
                        <td style="padding: 4px 0; color: #111111;">${fechaEntradaStr}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Salida:</td>
                        <td style="padding: 4px 0; color: #111111;">${fechaSalidaStr}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Noches:</td>
                        <td style="padding: 4px 0; color: #111111;">${nochesStr}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Huéspedes:</td>
                        <td style="padding: 4px 0; color: #111111;">${adultos} adulto(s) · ${ninos} niño(s)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Financiero Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #F3F6F9; border-left: 3px solid #00818A; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="40%" style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Total del paquete:</td>
                        <td style="padding: 4px 0; color: #111111; font-weight: bold;">${totalFormatted}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Anticipo recibido:</td>
                        <td style="padding: 4px 0; color: #111111;">${anticipoFormatted}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top; color: #00818A;">Saldo pendiente:</td>
                        <td style="padding: 4px 0; color: #00818A; font-weight: bold;">${saldoFormatted}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; padding: 4px 0; color: #555555; vertical-align: top;">Fecha límite de pago:</td>
                        <td style="padding: 4px 0; color: #D9381E; font-weight: bold;">${fechaLimitePagoStr}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin-top: 24px;">Para cualquier cambio o consulta, comuníquese directamente con su asesor <strong>${asesorNombre}</strong> al WhatsApp <strong>+52 986 244 4375</strong> o al correo <strong>reservaciones@bgcaribe.mx</strong>.</p>
              
              <p style="margin-bottom: 0;">Recuerde revisar los documentos adjuntos y firmar el contrato antes de la fecha límite de liquidación.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #112840; padding: 30px; text-align: center; font-size: 11px; line-height: 1.7; color: #A5B6C5; border-top: 1px solid #1E3854;">
              <strong style="color: #FFFFFF; font-size: 12px; display: block; margin-bottom: 4px;">BG Transportadora del Caribe, S.A. de C.V.</strong>
              RNT SECTUR: 0423005C28259<br/>
              Av. Cobá SM 35, Mza 2, Lte 12, Cancún, Q. Roo<br/>
              <span style="color: #00818A;">+52 (998) 609-0514</span> · <a href="mailto:reservaciones@bgcaribe.mx" style="color: #A5B6C5; text-decoration: none;">reservaciones@bgcaribe.mx</a><br/>
              <p style="margin: 12px 0 0 0; font-size: 10px; color: #6D8294; line-height: 1.4;">Este correo y sus adjuntos son confidenciales y están dirigidos únicamente al destinatario especificado.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = {
  buildEmailHTML
};
