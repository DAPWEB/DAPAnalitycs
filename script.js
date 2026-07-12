// DAP Website - Interacciones y formulario de contacto

const DAP_CONTACT_API_URL = "COLOCA_AQUI_LA_URL_EXEC_DE_TU_WEBAPP";

const navbar = document.getElementById("navbar");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => {
  if (navbar) {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
  }
});

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks?.classList.remove("open");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* ==============================
   FORMULARIO DE CONTACTO
   ============================== */

const contactForm = document.getElementById("contactForm");
const submitContact = document.getElementById("submitContact");
const formStatus = document.getElementById("formStatus");
const successModal = document.getElementById("contactSuccessModal");
const contactFolio = document.getElementById("contactFolio");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(field, message = "") {
  const group = field.closest(".form-group");
  if (!group) return;

  group.classList.toggle("has-error", Boolean(message));
  const errorElement = group.querySelector(".field-error");
  if (errorElement) errorElement.textContent = message;
}

function validateContactForm() {
  if (!contactForm) return false;

  let isValid = true;
  const nombre = contactForm.nombre;
  const empresa = contactForm.empresa;
  const correo = contactForm.correo;
  const servicio = contactForm.servicio;
  const privacidad = contactForm.privacidad;

  [nombre, empresa, correo, servicio].forEach((field) => setFieldError(field));

  if (!nombre.value.trim()) {
    setFieldError(nombre, "Escribe tu nombre.");
    isValid = false;
  }

  if (!empresa.value.trim()) {
    setFieldError(empresa, "Escribe el nombre de la empresa.");
    isValid = false;
  }

  if (!correo.value.trim()) {
    setFieldError(correo, "Escribe tu correo electrónico.");
    isValid = false;
  } else if (!EMAIL_REGEX.test(correo.value.trim())) {
    setFieldError(correo, "Escribe un correo electrónico válido.");
    isValid = false;
  }

  if (!servicio.value) {
    setFieldError(servicio, "Selecciona un servicio.");
    isValid = false;
  }

  if (!privacidad.checked) {
    formStatus.textContent = "Debes aceptar el aviso de privacidad.";
    formStatus.className = "form-status error";
    isValid = false;
  }

  return isValid;
}

function setSubmitting(isSubmitting) {
  if (!submitContact) return;

  submitContact.disabled = isSubmitting;
  submitContact.classList.toggle("is-loading", isSubmitting);

  const label = submitContact.querySelector(".submit-label");
  if (label) {
    label.textContent = isSubmitting ? "Enviando solicitud..." : "Enviar solicitud";
  }
}

function openSuccessModal(folio = "") {
  if (!successModal) return;

  if (contactFolio) {
    contactFolio.textContent = folio ? `Folio de seguimiento: ${folio}` : "";
  }

  successModal.classList.add("open");
  successModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeSuccessModal() {
  if (!successModal) return;

  successModal.classList.remove("open");
  successModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeSuccessModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSuccessModal();
});

contactForm?.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("input", () => {
    if (field.closest(".form-group")) setFieldError(field);
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.className = "form-status";
    }
  });
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateContactForm()) return;

  if (
    !DAP_CONTACT_API_URL ||
    DAP_CONTACT_API_URL.includes("COLOCA_AQUI")
  ) {
    formStatus.textContent = "Falta configurar la URL de la WebApp de Apps Script.";
    formStatus.className = "form-status error";
    return;
  }

  const formData = new FormData(contactForm);
  const payload = new URLSearchParams();

  formData.forEach((value, key) => {
    payload.append(key, String(value).trim());
  });

  // Marca sencilla para que el servidor reconozca esta integración.
  payload.append("origen", "DAP_WEBSITE");

  setSubmitting(true);
  formStatus.textContent = "Registrando su solicitud...";
  formStatus.className = "form-status";

  try {
    const response = await fetch(DAP_CONTACT_API_URL, {
      method: "POST",
      body: payload,
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió con estado ${response.status}.`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "No fue posible registrar la solicitud.");
    }

    contactForm.reset();
    formStatus.textContent = "";
    openSuccessModal(result.id || "");
  } catch (error) {
    console.error("Error al enviar el formulario:", error);
    formStatus.textContent =
      "No fue posible enviar la solicitud. Inténtelo nuevamente o escriba a contacto@dapanalytics.com.";
    formStatus.className = "form-status error";
  } finally {
    setSubmitting(false);
  }
});

