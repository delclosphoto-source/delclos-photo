/* delclos.photo — el mínim JavaScript imprescindible.
   Les xifres NO s'animen: van escrites a l'HTML perquè mai es puguin
   veure a zero si el JavaScript falla (era el problema del dossier antic). */

(function () {
  'use strict';

  var bar = document.querySelector('.bar');
  var hamb = document.querySelector('.hamb');
  var menu = document.getElementById('menu');

  /* --- capçalera sòlida en baixar --- */
  if (bar) {
    var solid = function () {
      bar.classList.toggle('solid', window.scrollY > 40);
    };
    solid();
    window.addEventListener('scroll', solid, { passive: true });
  }

  /* --- menú de mòbil --- */
  if (hamb && bar && menu) {
    var tanca = function () {
      bar.classList.remove('obert');
      hamb.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    hamb.addEventListener('click', function () {
      var obert = bar.classList.toggle('obert');
      hamb.setAttribute('aria-expanded', obert ? 'true' : 'false');
      document.body.style.overflow = obert ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') tanca();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bar.classList.contains('obert')) {
        tanca();
        hamb.focus();
      }
    });
  }

  /* --- aparició suau en entrar a pantalla --- */
  var reveals = document.querySelectorAll('.rev');
  var mou = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (mou || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('vist'); });
  } else {
    var obs = new IntersectionObserver(function (entrades) {
      entrades.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('vist');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(reveals, function (el) { obs.observe(el); });
  }

  /* --- tabs de serveis: mostren una cobertura alhora --- */
  var tabs = document.querySelectorAll('.casosuso__tab');
  Array.prototype.forEach.call(tabs, function (tab) {
    tab.addEventListener('click', function () {
      var sec = tab.closest('.sec');
      var grup = sec.querySelectorAll('.casosuso__tab');
      var casos = sec.querySelectorAll('.cobertura');
      var punts = sec.querySelectorAll('.casosuso__dot');
      Array.prototype.forEach.call(grup, function (t) { t.classList.remove('active'); });
      Array.prototype.forEach.call(casos, function (c) { c.classList.remove('active'); });
      Array.prototype.forEach.call(punts, function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var actiu = document.getElementById(tab.dataset.tab);
      if (actiu) actiu.classList.add('active');
      var punt = sec.querySelector('.casosuso__dot[data-dot="' + tab.dataset.tab + '"]');
      if (punt) punt.classList.add('active');
    });
  });

  /* --- mosaic d'"El treball": en mòbil, desplega la resta de fotos --- */
  var mesFotos = document.querySelector('.mosaic__more');
  if (mesFotos) {
    mesFotos.addEventListener('click', function () {
      var mosaic = mesFotos.previousElementSibling;
      if (mosaic) mosaic.classList.add('mosaic--tot');
      mesFotos.remove();
    });
  }

  /* --- FAQ: només una oberta alhora --- */
  var faqs = document.querySelectorAll('.faq details');
  Array.prototype.forEach.call(faqs, function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      Array.prototype.forEach.call(faqs, function (altra) {
        if (altra !== d) altra.open = false;
      });
    });
  });
})();
