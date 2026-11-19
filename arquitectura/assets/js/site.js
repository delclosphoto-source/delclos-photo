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

  /* ----------------------------------------------- repartir bé la galeria
     Les columnes de CSS reparteixen el contingut com poden i sovint deixen
     una portada tota sola a baix. Aquí es posa cada fotografia a la columna
     que de moment és més curta, sense que cap columna passi del que li toca:
     així totes acaben a la mateixa alçada i no queda cap foto despenjada. */
  function mosaic() {
    var galeria = document.querySelector(".galeria");
    if (!galeria) return;

    var portades = Array.prototype.slice.call(galeria.querySelectorAll(".portada"));
    if (portades.length < 3) return;

    function alcada(portada) {
      var img = portada.querySelector("img");
      if (!img) return 1;
      var retall = img.style.aspectRatio;
      if (retall) {
        var parts = retall.split("/");
        var ample = parseFloat(parts[0]);
        var alt = parts.length > 1 ? parseFloat(parts[1]) : 1;
        if (ample > 0 && alt > 0) return alt / ample;
      }
      var w = parseFloat(img.getAttribute("width"));
      var h = parseFloat(img.getAttribute("height"));
      if (w > 0 && h > 0) return h / w;
      return 1;
    }

    var alcades = portades.map(alcada);

    function quantesColumnes() {
      var deia = getComputedStyle(galeria).getPropertyValue("--columnes");
      var n = parseInt(deia, 10);
      return n > 0 ? n : 1;
    }

    var ara = 0;

    function repartir() {
      var cols = quantesColumnes();
      if (cols === ara) return;
      ara = cols;

      if (cols < 2) {
        galeria.classList.remove("galeria--repartida");
        portades.forEach(function (portada) { galeria.appendChild(portada); });
        Array.prototype.slice.call(galeria.querySelectorAll(".columna"))
          .forEach(function (c) { galeria.removeChild(c); });
        return;
      }

      /* Primer, el repartiment rapid: cada foto a la columna mes curta,
         sense que cap columna passi de les que li toquen. */
      var maxim = Math.ceil(portades.length / cols);
      var tria = new Array(portades.length);
      var altures = new Array(cols);
      var quantes = new Array(cols);
      var i, k;
      for (i = 0; i < cols; i++) { altures[i] = 0; quantes[i] = 0; }
      for (i = 0; i < portades.length; i++) {
        var millor = -1;
        for (k = 0; k < cols; k++) {
          if (quantes[k] >= maxim) continue;
          if (millor < 0 || altures[k] < altures[millor]) millor = k;
        }
        if (millor < 0) millor = 0;
        tria[i] = millor;
        altures[millor] += alcades[i] + 0.08;
        quantes[millor]++;
      }

      /* Si la galeria es prou petita, es proven totes les maneres de repartir-la
         i es queda la que deixa les columnes mes igualades: aixi cap fotografia
         queda despenjada a baix. L'ordre dels projectes no es toca. */
      function puntua(assignacio) {
        var alt = [], qua = [], n;
        for (n = 0; n < cols; n++) { alt[n] = 0; qua[n] = 0; }
        for (n = 0; n < assignacio.length; n++) {
          alt[assignacio[n]] += alcades[n] + 0.08;
          qua[assignacio[n]]++;
        }
        var maxA = Math.max.apply(null, alt), minA = Math.min.apply(null, alt);
        var maxQ = Math.max.apply(null, qua), minQ = Math.min.apply(null, qua);
        return (maxA - minA) + 0.25 * (maxQ - minQ);
      }

      /* Els primers projectes es queden al capdamunt de cada columna, en
         l'ordre de treballs.json: la primera fila de la galeria no es mou.
         Nomes es busca el millor lloc per a la resta. */
      var lliures = portades.length - cols;
      var proves = lliures > 0 ? Math.pow(cols, lliures) : 0;
      if (lliures > 0 && proves <= 300000) {
        var millorPunt = puntua(tria);
        var actual = new Array(portades.length);
        for (i = 0; i < cols; i++) actual[i] = i;
        for (var n = 0; n < proves; n++) {
          var resta = n;
          for (i = cols; i < portades.length; i++) {
            actual[i] = resta % cols;
            resta = Math.floor(resta / cols);
          }
          var punt = puntua(actual);
          if (punt < millorPunt) {
            millorPunt = punt;
            tria = actual.slice();
          }
        }
      }

      var columnes = [];
      for (i = 0; i < cols; i++) {
        var columna = document.createElement("div");
        columna.className = "columna";
        columnes.push(columna);
      }
      for (i = 0; i < portades.length; i++) {
        columnes[tria[i]].appendChild(portades[i]);
      }

      Array.prototype.slice.call(galeria.querySelectorAll(".columna"))
        .forEach(function (c) { galeria.removeChild(c); });
      columnes.forEach(function (c) { galeria.appendChild(c); });
      galeria.classList.add("galeria--repartida");
    }

    repartir();

    var espera;
    window.addEventListener("resize", function () {
      if (espera) window.clearTimeout(espera);
      espera = window.setTimeout(repartir, 150);
    }, { passive: true });
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
    mosaic();
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
