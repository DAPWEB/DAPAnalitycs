/*******************************************************
 * DAP - API DE CONTACTO WEB
 * Base de datos:
 * 199v8njv6c-oQepGwWt6Grf8hnaGxbm4L25mL20kO7Ig
 * Hoja: BD_CONTACTO_WEB
 *******************************************************/

const DAP_CONTACT_DB_ID = "199v8njv6c-oQepGwWt6Grf8hnaGxbm4L25mL20kO7Ig";
const DAP_CONTACT_SHEET = "BD_CONTACTO_WEB";

const DAP_NOTIFICATION_EMAIL = "contacto@dapanalytics.com";
const DAP_SENDER_ALIAS = "contacto@dapanalytics.com";
const DAP_SENDER_NAME = "DAP | Digitalización y Automatización de Procesos";

/*
 * IMPORTANTE:
 * Usa una URL pública HTTPS del logo. La imagen dentro de GitHub Pages puede
 * utilizarse, por ejemplo:
 * https://dapanalytics.com/assets/Logo_DAP_Letras_azulverde.png
 */
const DAP_LOGO_URL =
  "https://dapanalytics.com/assets/Logo_DAP_Letras_azulverde.png";

const DAP_ALLOWED_SERVICES = [
  "DAP Suites",
  "DAP Desarrollo",
  "DAP IA Analytics"
];

/**
 * Página básica de diagnóstico/prueba del proyecto de Apps Script.
 */
function doGet() {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Contacto DAP")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Recibe solicitudes desde GitHub Pages.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const data = normalizePayload_(e);
    validatePayload_(data);

    // Campo señuelo: si un bot lo llenó, respondemos como éxito sin guardar.
    if (data.website) {
      return jsonResponse_({
        success: true,
        id: "",
        message: "Solicitud recibida."
      });
    }

    const sheet = getContactSheet_();
    ensureHeaders_(sheet);

    const id = getNextContactId_(sheet);
    const registro = new Date();
    const estatus = "PENDIENTE";

    sheet.appendRow([
      id,
      registro,
      data.nombre,
      data.empresa,
      data.correo,
      data.telefono,
      data.servicio,
      data.mensaje,
      estatus
    ]);

    const emailWarnings = [];

    try {
      sendInternalNotification_({
        id,
        registro,
        estatus,
        ...data
      });
    } catch (mailError) {
      console.error("No se envió la notificación interna:", mailError);
      emailWarnings.push("notificación interna");
    }

    try {
      sendProspectConfirmation_({
        id,
        registro,
        ...data
      });
    } catch (mailError) {
      console.error("No se envió la confirmación al prospecto:", mailError);
      emailWarnings.push("confirmación al prospecto");
    }

    return jsonResponse_({
      success: true,
      id,
      message: emailWarnings.length
        ? "Solicitud guardada. Uno o más correos no pudieron enviarse."
        : "Solicitud registrada correctamente."
    });

  } catch (error) {
    console.error(error);

    return jsonResponse_({
      success: false,
      message: error && error.message
        ? error.message
        : "Ocurrió un error al registrar la solicitud."
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

/**
 * También permite probar el guardado desde el Index.html de Apps Script
 * mediante google.script.run.
 */
function dap_saveContactFromApp(payload) {
  const simulatedEvent = { parameter: payload || {} };
  const response = doPost(simulatedEvent);
  return JSON.parse(response.getContent());
}

function normalizePayload_(e) {
  const p = (e && e.parameter) || {};

  return {
    nombre: sanitize_(p.nombre, 120),
    empresa: sanitize_(p.empresa, 150),
    correo: sanitize_(p.correo, 150).toLowerCase(),
    telefono: sanitize_(p.telefono, 30),
    servicio: sanitize_(p.servicio, 80),
    mensaje: sanitize_(p.mensaje, 2000),
    privacidad: sanitize_(p.privacidad, 20),
    website: sanitize_(p.website, 200),
    origen: sanitize_(p.origen, 50)
  };
}

function validatePayload_(data) {
  if (!data.nombre) throw new Error("El nombre es obligatorio.");
  if (!data.empresa) throw new Error("La empresa es obligatoria.");
  if (!data.correo) throw new Error("El correo es obligatorio.");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.correo)) {
    throw new Error("El correo electrónico no tiene un formato válido.");
  }

  if (!data.servicio) {
    throw new Error("Debe seleccionar un servicio.");
  }

  if (!DAP_ALLOWED_SERVICES.includes(data.servicio)) {
    throw new Error("El servicio seleccionado no es válido.");
  }

  if (data.origen && data.origen !== "DAP_WEBSITE") {
    throw new Error("Origen de solicitud no reconocido.");
  }
}

function getContactSheet_() {
  const ss = SpreadsheetApp.openById(DAP_CONTACT_DB_ID);
  const sheet = ss.getSheetByName(DAP_CONTACT_SHEET);

  if (!sheet) {
    throw new Error(
      `No existe la hoja "${DAP_CONTACT_SHEET}" en la base de datos.`
    );
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  const expectedHeaders = [
    "ID",
    "REGISTRO",
    "NOMBRE",
    "EMPRESA",
    "CORREO",
    "TELÉFONO",
    "SERVICIO",
    "MENSAJE",
    "ESTATUS"
  ];

  const currentHeaders = sheet
    .getRange(1, 1, 1, expectedHeaders.length)
    .getDisplayValues()[0];

  const isEmpty = currentHeaders.every(value => !String(value).trim());

  if (isEmpty) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length)
      .setFontWeight("bold")
      .setBackground("#082235")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    return;
  }

  const mismatch = expectedHeaders.some(
    (header, index) =>
      String(currentHeaders[index] || "").trim().toUpperCase() !== header
  );

  if (mismatch) {
    throw new Error(
      "Los encabezados de BD_CONTACTO_WEB no coinciden con la estructura A:I esperada."
    );
  }
}

function getNextContactId_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return "DAP-CTT_WEB-001";
  }

  const ids = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getDisplayValues()
    .flat();

  let maxNumber = 0;

  ids.forEach(id => {
    const match = String(id).trim().match(/^DAP-CTT_WEB-(\d+)$/i);
    if (match) {
      maxNumber = Math.max(maxNumber, Number(match[1]));
    }
  });

  return `DAP-CTT_WEB-${String(maxNumber + 1).padStart(3, "0")}`;
}

function sendInternalNotification_(data) {
  const subject =
    `Nueva solicitud DAP | ${data.servicio} | ${data.empresa} | ${data.id}`;

  const plainBody = [
    "Se recibió una nueva solicitud desde dapanalytics.com.",
    "",
    `Folio: ${data.id}`,
    `Registro: ${formatDate_(data.registro)}`,
    `Nombre: ${data.nombre}`,
    `Empresa: ${data.empresa}`,
    `Correo: ${data.correo}`,
    `Teléfono: ${data.telefono || "No proporcionado"}`,
    `Servicio: ${data.servicio}`,
    `Mensaje: ${data.mensaje || "Sin mensaje"}`,
    `Estatus: ${data.estatus}`
  ].join("\n");

  const htmlBody = buildInternalEmailHtml_(data);

  sendCorporateEmail_(
    DAP_NOTIFICATION_EMAIL,
    subject,
    plainBody,
    htmlBody,
    {
      replyTo: data.correo
    }
  );
}

function sendProspectConfirmation_(data) {
  const subject = `Recibimos su solicitud | DAP | ${data.id}`;

  const plainBody = [
    `Hola ${data.nombre},`,
    "",
    "Gracias por ponerse en contacto con DAP.",
    `Hemos registrado su solicitud con el folio ${data.id}.`,
    `Servicio de interés: ${data.servicio}.`,
    "",
    "Nuestro equipo revisará la información y se comunicará con usted.",
    "",
    "DAP | Digitalización y Automatización de Procesos",
    "contacto@dapanalytics.com",
    "https://dapanalytics.com"
  ].join("\n");

  const htmlBody = buildProspectEmailHtml_(data);

  sendCorporateEmail_(
    data.correo,
    subject,
    plainBody,
    htmlBody,
    {
      replyTo: DAP_NOTIFICATION_EMAIL
    }
  );
}

/**
 * Envía desde contacto@dapanalytics.com solo si esa dirección aparece
 * como alias autorizado de la cuenta que ejecuta el Apps Script.
 */
function sendCorporateEmail_(recipient, subject, plainBody, htmlBody, extraOptions) {
  const aliases = GmailApp.getAliases();
  const canUseAlias = aliases.some(
    alias => alias.toLowerCase() === DAP_SENDER_ALIAS.toLowerCase()
  );

  const options = {
    htmlBody,
    name: DAP_SENDER_NAME,
    ...(extraOptions || {})
  };

  if (canUseAlias) {
    options.from = DAP_SENDER_ALIAS;
  } else {
    console.warn(
      `El alias ${DAP_SENDER_ALIAS} no está configurado en la cuenta ejecutora. ` +
      "El correo saldrá desde la cuenta principal autorizada."
    );
  }

  GmailApp.sendEmail(recipient, subject, plainBody, options);
}

function buildInternalEmailHtml_(data) {
  const rows = [
    ["Folio", data.id],
    ["Registro", formatDate_(data.registro)],
    ["Nombre", data.nombre],
    ["Empresa", data.empresa],
    ["Correo", data.correo],
    ["Teléfono", data.telefono || "No proporcionado"],
    ["Servicio", data.servicio],
    ["Estatus", data.estatus]
  ];

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:11px 14px;border-bottom:1px solid #dbe8ef;
                 width:32%;font-weight:700;color:#0b3b55;">
        ${escapeHtml_(label)}
      </td>
      <td style="padding:11px 14px;border-bottom:1px solid #dbe8ef;
                 color:#233745;">
        ${escapeHtml_(value)}
      </td>
    </tr>
  `).join("");

  return emailShell_(`
    <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;
                text-transform:uppercase;color:#42a62f;">
      Nueva oportunidad comercial
    </div>
    <h1 style="margin:10px 0 8px;font-size:25px;line-height:1.25;color:#082235;">
      Nueva solicitud desde dapanalytics.com
    </h1>
    <p style="margin:0 0 22px;color:#536b79;">
      Se registró una nueva solicitud de información. Puede responder
      directamente a este mensaje para contactar al prospecto.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="border-collapse:collapse;border:1px solid #dbe8ef;
                  border-radius:12px;overflow:hidden;">
      ${rowsHtml}
    </table>

    <div style="margin-top:22px;padding:18px;border-radius:12px;
                background:#f3f9fc;border-left:4px solid #00a5d8;">
      <strong style="display:block;margin-bottom:7px;color:#082235;">Mensaje</strong>
      <div style="white-space:pre-line;color:#3e5563;">
        ${escapeHtml_(data.mensaje || "Sin mensaje adicional.")}
      </div>
    </div>

    <div style="margin-top:22px;">
      <a href="mailto:${encodeURIComponent(data.correo)}"
         style="display:inline-block;padding:12px 22px;border-radius:999px;
                background:linear-gradient(135deg,#009fe8,#00b8c8,#42c928);
                color:#ffffff;text-decoration:none;font-weight:800;">
        Responder al prospecto
      </a>
    </div>
  `);
}

function buildProspectEmailHtml_(data) {
  return emailShell_(`
    <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;
                text-transform:uppercase;color:#42a62f;">
      Solicitud recibida
    </div>
    <h1 style="margin:10px 0 8px;font-size:25px;line-height:1.25;color:#082235;">
      Gracias por ponerse en contacto con DAP
    </h1>
    <p style="margin:0 0 18px;color:#536b79;">
      Hola <strong>${escapeHtml_(data.nombre)}</strong>,
    </p>
    <p style="margin:0 0 18px;color:#536b79;">
      Hemos recibido correctamente su solicitud relacionada con
      <strong>${escapeHtml_(data.servicio)}</strong>.
      Nuestro equipo revisará la información y se comunicará con usted.
    </p>

    <div style="margin:24px 0;padding:20px;border-radius:14px;
                background:#f3f9fc;border:1px solid #dbe8ef;text-align:center;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.2px;
                  color:#607783;font-weight:700;">
        Folio de seguimiento
      </div>
      <div style="margin-top:7px;font-size:22px;font-weight:900;color:#009fe8;">
        ${escapeHtml_(data.id)}
      </div>
    </div>

    <p style="margin:0;color:#536b79;">
      Para complementar su solicitud, puede responder directamente a este correo.
    </p>
  `);
}

function emailShell_(content) {
  return `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body style="margin:0;padding:0;background:#eef5f8;
               font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="background:#eef5f8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellspacing="0" cellpadding="0"
                 style="width:100%;max-width:620px;background:#ffffff;
                        border-radius:18px;overflow:hidden;
                        box-shadow:0 14px 42px rgba(8,34,53,.12);">
            <tr>
              <td style="padding:24px 30px;background:#061b29;
                         border-bottom:4px solid #42c928;">
                <img src="${DAP_LOGO_URL}" alt="DAP"
                     style="display:block;width:135px;max-height:70px;
                            object-fit:contain;">
              </td>
            </tr>
            <tr>
              <td style="padding:34px 30px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;background:#061b29;
                         color:#c9dce6;font-size:12px;line-height:1.6;">
                <strong style="color:#ffffff;">
                  DAP | Digitalización y Automatización de Procesos
                </strong><br>
                contacto@dapanalytics.com ·
                <a href="https://dapanalytics.com"
                   style="color:#20c4ff;text-decoration:none;">
                  dapanalytics.com
                </a>
                <br><br>
                Este mensaje fue generado automáticamente a partir del
                formulario de contacto de DAP.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

function sanitize_(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone() || "America/Mexico_City",
    "dd/MM/yyyy HH:mm:ss"
  );
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ejecuta esta función una sola vez desde el editor para:
 * 1. Autorizar Spreadsheet y Gmail.
 * 2. Confirmar qué alias reconoce la cuenta.
 */
function dap_authorizeAndCheckAliases() {
  const sheet = getContactSheet_();
  ensureHeaders_(sheet);

  const aliases = GmailApp.getAliases();

  console.log({
    ejecutor: Session.getEffectiveUser().getEmail(),
    aliases,
    aliasConfigurado: aliases.includes(DAP_SENDER_ALIAS)
  });

  return {
    ejecutor: Session.getEffectiveUser().getEmail(),
    aliases,
    aliasConfigurado: aliases.includes(DAP_SENDER_ALIAS)
  };
}
