(function () {
  'use strict';

  /* ======================
     Mobile Menu
     ====================== */
  const menuBtn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');

  if (menuBtn && menu) {
    function toggleMenu(force) {
      const isOpen = force !== undefined ? force : menuBtn.getAttribute('aria-expanded') === 'false';
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    menuBtn.addEventListener('click', function () { toggleMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        toggleMenu(false);
        menuBtn.focus();
      }
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });
  }

  /* ======================
     Hero reveal (panel de contacto)
     ====================== */
  const hero = document.querySelector('.hero');
  const helpToggle = document.querySelector('[data-help-toggle]');
  const helpPanel = document.querySelector('[data-help-panel]');
  const helpForm = document.querySelector('[data-help-form]');
  const heroFaro = document.querySelector('[data-hero-faro]');
  const introText = document.querySelector('.hero__intro-text');

  if (hero && helpToggle && helpPanel && helpForm) {
    let firstField = helpForm.querySelector('input, select, textarea');

    function setOpen(open) {
      hero.classList.toggle('is-open', open);
      helpToggle.setAttribute('aria-expanded', String(open));
      helpToggle.textContent = open ? 'Cerrar ✕' : 'Necesito ayuda';
      helpForm.hidden = !open;
      if (heroFaro) heroFaro.hidden = !open;
      if (open && firstField) {
        // Pequeño retardo para que la transición del grid inicie primero
        setTimeout(function () { firstField.focus(); }, 300);
      } else if (!open && helpToggle) {
        helpToggle.focus();
      }
    }

    helpToggle.addEventListener('click', function () {
      setOpen(!hero.classList.contains('is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hero.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  /* ======================
     Año en footer
     ====================== */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======================
     Formulario (validación + envío a Google Sheets)
     ====================== */
  var form = document.querySelector('#form-hero');
  if (form) {
    var submitBtn = form.querySelector('[data-form-submit]');
    var statusEl = form.querySelector('[data-form-status]');
    var ENDPOINT = window.FAROLABS_FORM_ENDPOINT || '/api/leads';

    function fieldError(input, msg) {
      var group = input.closest('.form__group');
      var errEl = group ? group.querySelector('.form__error') : null;
      if (errEl) errEl.textContent = msg || '';
      input.classList.toggle('error', !!msg);
      input.classList.toggle('valid', !msg);
      return !msg;
    }

    function validar() {
      var ok = true;
      var nombre = form.querySelector('[name="nombre"]');
      var contacto = form.querySelector('[name="valor_contacto"]');
      var descripcion = form.querySelector('[name="descripcion"]');
      var urgencia = form.querySelector('[name="urgencia"]');

      // RN-01: Nombre obligatorio
      if (!nombre.value.trim()) { fieldError(nombre, 'Ingresa tu nombre.'); ok = false; }
      else fieldError(nombre, '');

      // RN-02 (simplificado): Contacto siempre email
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!contacto.value.trim()) { fieldError(contacto, 'Ingresa tu correo.'); ok = false; }
      else if (!emailRe.test(contacto.value.trim())) { fieldError(contacto, 'Correo no válido.'); ok = false; }
      else fieldError(contacto, '');

      // RN-03: Descripción mínimo 10 caracteres
      if (descripcion.value.trim().length < 10) { fieldError(descripcion, 'Mínimo 10 caracteres.'); ok = false; }
      else fieldError(descripcion, '');

      // RN-04: Urgencia tiene default; RN-05 se maneja al enviar
      return { ok: ok, data: {
        nombre: nombre.value.trim(),
        contacto: contacto.value.trim(),
        descripcion: descripcion.value.trim(),
        urgencia: urgencia ? urgencia.value : 'media'
      } };
    }

    // Validación en vivo
    form.querySelectorAll('.form__input').forEach(function (inp) {
      inp.addEventListener('blur', function () { validar(); });
      inp.addEventListener('input', function () { if (inp.classList.contains('error')) validar(); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = validar();
      if (!res.ok) {
        if (statusEl) { statusEl.textContent = 'Revisa los campos marcados.'; statusEl.className = 'form__status error'; }
        return;
      }
      // RN-05: deshabilitar botón durante el envío
      if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('loading'); }
      if (statusEl) { statusEl.textContent = 'Enviando…'; statusEl.className = 'form__status'; }

      var payload = Object.assign({ fecha: new Date().toISOString() }, res.data);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function () { return { ok: true }; })
        .catch(function () { return { ok: false }; })
        .then(function (r) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('loading'); }
          if (r.ok) {
            if (statusEl) { statusEl.textContent = '¡Gracias! Te contactaremos pronto.'; statusEl.className = 'form__status success'; }
            form.reset();
            form.querySelectorAll('.form__input').forEach(function (i) { i.classList.remove('valid', 'error'); });
          } else {
            if (statusEl) { statusEl.textContent = 'Ocurrió un error. Inténtalo de nuevo.'; statusEl.className = 'form__status error'; }
          }
        });
    });
  }
})();
