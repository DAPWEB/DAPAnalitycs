// DAP Website - Interacciones y formulario de contacto

const DAP_CONTACT_API_URL = "https://script.google.com/macros/s/AKfycbxJER7bnck8S8qI115v7sayzXAOU9Y3_OYA5MKYh18PHBzPQe9PD-BMkRwzm0ANEwq1/exec";

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






/* ======================================================
   CARRUSEL DE EMPRESAS - SECCIÓN QUIÉNES SOMOS
====================================================== */

function initBusinessCarousel() {
  const carousel = document.querySelector(".business-carousel");

  if (!carousel) return;

  const viewport = carousel.querySelector(".business-carousel-viewport");
  const track = carousel.querySelector(".business-carousel-track");
  const slides = Array.from(
    carousel.querySelectorAll(".business-carousel-slide")
  );

  const previousButton = carousel.querySelector(
    ".business-carousel-prev"
  );

  const nextButton = carousel.querySelector(
    ".business-carousel-next"
  );

  const dotsContainer = document.querySelector(
    ".business-carousel-dots"
  );

  if (
    !viewport ||
    !track ||
    !previousButton ||
    !nextButton ||
    !dotsContainer ||
    slides.length === 0
  ) {
    return;
  }

  let currentIndex = 0;
  let startPositionX = 0;
  let endPositionX = 0;

  const dots = slides.map((slide, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "business-carousel-dot";
    dot.setAttribute(
      "aria-label",
      `Mostrar imagen empresarial ${index + 1}`
    );

    dot.addEventListener("click", () => {
      currentIndex = index;
      updateCarousel();
    });

    dotsContainer.appendChild(dot);

    return dot;
  });

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
      dot.setAttribute(
        "aria-current",
        index === currentIndex ? "true" : "false"
      );
    });
  }

  function showNextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  }

  function showPreviousSlide() {
    currentIndex =
      (currentIndex - 1 + slides.length) % slides.length;

    updateCarousel();
  }

  nextButton.addEventListener("click", showNextSlide);
  previousButton.addEventListener("click", showPreviousSlide);

  viewport.addEventListener(
    "touchstart",
    (event) => {
      startPositionX = event.touches[0].clientX;
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchend",
    (event) => {
      endPositionX = event.changedTouches[0].clientX;

      const movement = startPositionX - endPositionX;
      const minimumMovement = 45;

      if (movement > minimumMovement) {
        showNextSlide();
      }

      if (movement < -minimumMovement) {
        showPreviousSlide();
      }
    },
    { passive: true }
  );

  carousel.setAttribute("tabindex", "0");

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      showNextSlide();
    }

    if (event.key === "ArrowLeft") {
      showPreviousSlide();
    }
  });

  updateCarousel();
}

document.addEventListener("DOMContentLoaded", initBusinessCarousel);
