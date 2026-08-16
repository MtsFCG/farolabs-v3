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
})();
