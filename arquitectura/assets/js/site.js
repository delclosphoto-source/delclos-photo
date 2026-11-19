/* Pol Delclòs — comportament de la web.
   Nomes transicions d'opacitat. Tot el moviment es desactiva si el sistema
   demana menys moviment. Si aquest fitxer no s'arriba a executar, la web
   es veu i es fa servir igual: res queda amagat. */
(function () {
  "use strict";

  var arrel = document.documentElement;
  var menysMoviment = window.matchMedia("(prefers-reduced-motion: reduce)");

  function esQuiet() { return menysMoviment.matches; }

  /* ------------------------------------------- aparicions suaus amb scroll */
  function aparicions() {
    var elements = Array.prototype.slice.call(document.querySelectorAll(".revela"));
    if (!elements.length) return;

    function mostrarTot() {
      elements.forEach(function (el) { el.classList.add("vist"); });
    }
    if (!("IntersectionObserver" in window) || esQuiet()) { mostrarTot(); return; }

    arrel.classList.add("js");
    var vigilant = new IntersectionObserver(function (entrades) {
      entrades.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("vist");
          vigilant.unobserve(entrada.target);
        }
      });
    }, { rootMargin: "120px 0px 0px 0px", threshold: 0.01 });
    elements.forEach(function (el) { vigilant.observe(el); });

    /* Xarxa de seguretat: passi el que passi, al cap de 2 segons tot es veu. */
    window.setTimeout(mostrarTot, 2000);
  }

  /* ----------------------------------------------- recordar l'idioma triat */
  function idiomes() {
    var caixa = document.querySelector(".idiomes");
    if (!caixa) return;
    var enllacos = Array.prototype.slice.call(caixa.querySelectorAll("a"));
    var actual = arrel.getAttribute("lang");

    enllacos.forEach(function (a) {
      a.addEventListener("click", function () {
        try { localStorage.setItem("delclos-idioma", a.getAttribute("hreflang")); } catch (e) {}
      });
    });

    /* Nomes a la portada: si el visitant ja havia triat un altre idioma, hi va. */
    if (document.body.getAttribute("data-pagina") !== "projectes") return;
    var desat;
    try { desat = localStorage.getItem("delclos-idioma"); } catch (e) { return; }
    if (!desat || desat === actual) return;
    try {
      if (sessionStorage.getItem("delclos-idioma-fet")) return;
      sessionStorage.setItem("delclos-idioma-fet", "1");
    } catch (e) {}
    for (var i = 0; i < enllacos.length; i++) {
      if (enllacos[i].getAttribute("hreflang") === desat) {
        window.location.replace(enllacos[i].href);
        return;
      }
    }
  }

  /* ------------------------- tornar a la galeria on s'havia quedat el visitant */
  function recordarPosicio() {
    if (document.body.getAttribute("data-pagina") !== "projectes") return;
    var clau = "delclos-posicio-" + arrel.getAttribute("lang");

    function desar() {
      try { sessionStorage.setItem(clau, String(Math.round(window.scrollY))); } catch (e) {}
    }
    var espera;
    window.addEventListener("scroll", function () {
      if (espera) return;
      espera = window.setTimeout(function () { espera = null; desar(); }, 250);
    }, { passive: true });
    window.addEventListener("pagehide", desar);

    /* Nomes recupera la posicio si venim d'una pagina de la mateixa web. */
    var de = document.referrer;
    if (!de || de.indexOf(window.location.origin) !== 0) return;
    if (window.location.hash) return;
    var y;
    try { y = parseInt(sessionStorage.getItem(clau) || "0", 10); } catch (e) { return; }
    if (!y) return;

    /* El navegador tambe toca el scroll en carregar: ho fem nosaltres i hi insistim. */
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    function tornar() { window.scrollTo(0, y); }
    tornar();
    window.requestAnimationFrame(tornar);
    window.addEventListener("load", function () {
      tornar();
      window.setTimeout(tornar, 80);
    });
  }

  /* ------------------------------------------------------- ampliar les fotos */
  function lupa() {
    var dialeg = document.querySelector(".lupa");
    var botons = Array.prototype.slice.call(document.querySelectorAll(".ampliar"));
    if (!dialeg || !botons.length || typeof dialeg.showModal !== "function") return;

    var contingut = dialeg.querySelector(".lupa__contingut");
    var comptador = dialeg.querySelector(".lupa__comptador");
    var tancar = dialeg.querySelector(".lupa__tancar");
    var paraulaDe = comptador ? comptador.getAttribute("data-de") || "/" : "/";
    var actual = 0;
    var darrerBoto = null;
    var scrollAbans = 0;

    function mostrar(index) {
      actual = (index + botons.length) % botons.length;
      var original = botons[actual].querySelector("picture");
      contingut.innerHTML = "";
      if (!original) return;
      var copia = original.cloneNode(true);
      var imatge = copia.querySelector("img");
      if (imatge) {
        imatge.setAttribute("sizes", "94vw");
        imatge.setAttribute("loading", "eager");
        imatge.removeAttribute("width");
        imatge.removeAttribute("height");
      }
      Array.prototype.forEach.call(copia.querySelectorAll("source"), function (s) {
        s.setAttribute("sizes", "94vw");
      });
      contingut.appendChild(copia);
      if (comptador) comptador.textContent = (actual + 1) + " " + paraulaDe + " " + botons.length;
    }

    function obrir(index, boto) {
      darrerBoto = boto;
      scrollAbans = window.scrollY;
      mostrar(index);
      dialeg.showModal();
      document.body.style.overflow = "hidden";
      if (tancar) tancar.focus();
    }

    botons.forEach(function (boto, index) {
      boto.addEventListener("click", function () { obrir(index, boto); });
    });

    if (tancar) tancar.addEventListener("click", function () { dialeg.close(); });
    dialeg.querySelector(".lupa__anterior").addEventListener("click", function () { mostrar(actual - 1); });
    dialeg.querySelector(".lupa__seguent").addEventListener("click", function () { mostrar(actual + 1); });

    contingut.addEventListener("click", function (e) {
      if (e.target === contingut) dialeg.close();
    });

    dialeg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); mostrar(actual - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); mostrar(actual + 1); }
    });

    dialeg.addEventListener("close", function () {
      contingut.innerHTML = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollAbans);
      if (darrerBoto) darrerBoto.focus();
    });
  }

  function engegar() {
    aparicions();
    idiomes();
    recordarPosicio();
    lupa();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", engegar);
  } else {
    engegar();
  }
})();
