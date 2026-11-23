(function () {
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* L'heure à Paris */
  var heure = document.getElementById('heure');
  if (heure) {
    var tick = function () {
      try { heure.textContent = new Date().toLocaleTimeString(document.documentElement.lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }); } catch (e) {}
    };
    tick(); setInterval(tick, 30000);
  }

  /* Le menu sur mobile */
  var ouvrir = document.getElementById('ouvrir'), feuille = document.getElementById('feuille');
  if (ouvrir && feuille) {
    var basculer = function (o) {
      feuille.classList.toggle('ouverte', o);
      ouvrir.setAttribute('aria-expanded', o ? 'true' : 'false');
    };
    ouvrir.addEventListener('click', function () { basculer(!feuille.classList.contains('ouverte')); });
    Array.prototype.forEach.call(feuille.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { basculer(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') basculer(false); });
    document.addEventListener('click', function (e) { if (!feuille.contains(e.target) && !ouvrir.contains(e.target)) basculer(false); });
  }

  /* Le lien de la section en cours s'allume dans la barre */
  var liens = document.querySelectorAll('.barre .lien[href^="#"]');
  if (liens.length && 'IntersectionObserver' in window) {
    var parId = {};
    Array.prototype.forEach.call(liens, function (a) { parId[a.getAttribute('href').slice(1)] = a; });
    var visibles = {};
    var maj = function () {
      var actif = null;
      Object.keys(parId).forEach(function (id) { if (visibles[id] && !actif) actif = id; });
      Array.prototype.forEach.call(liens, function (a) { a.classList.toggle('actif', a === parId[actif]); });
    };
    var obsNav = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visibles[e.target.id] = e.isIntersecting; });
      maj();
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(parId).forEach(function (id) { var s = document.getElementById(id); if (s) obsNav.observe(s); });
  }

  /* Apparition douce */
  var monte = document.querySelectorAll('.monte');
  if ('IntersectionObserver' in window && !calme) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(monte, function (el) { obs.observe(el); });
  } else {
    Array.prototype.forEach.call(monte, function (el) { el.classList.add('vu'); });
  }

  /* La carte s'incline un peu sous la souris */
  var carte = document.getElementById('carte');
  if (carte && !calme && window.matchMedia('(pointer: fine)').matches) {
    carte.addEventListener('mousemove', function (e) {
      var r = carte.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      carte.style.transform = 'perspective(1400px) rotateY(' + (x * 3.5) + 'deg) rotateX(' + (-y * 3.5) + 'deg)';
    });
    carte.addEventListener('mouseleave', function () { carte.style.transform = ''; });
  }

  /* La demande d'audit */
  var form = document.getElementById('form-audit'), T = window.TXT;
  if (!form || !T) return;
  var erreur = document.getElementById('erreur'), bouton = document.getElementById('bouton-envoyer'), envoi = document.getElementById('envoi');
  var ADRESSE = 'oscomarch@gmail.com';
  /* Clé Web3Forms : publique par conception, elle dit seulement à quelle adresse envoyer */
  var CLE_WEB3FORMS = 'a63e1a6d-1380-4fa7-a410-fd2dbf92d078';
  var LIBELLE = bouton.innerHTML;
  function val(id) { return (document.getElementById(id).value || '').trim(); }
  function texte() {
    return T.lettre_tete + '\n\n'
      + T.l_nom + ' · ' + val('f-prenom') + '\n'
      + T.l_marque + ' · ' + val('f-marque') + '\n'
      + T.l_email + ' · ' + val('f-email') + '\n'
      + T.l_abo + ' · ' + (val('f-audience') || '…') + '\n\n'
      + T.l_envie + '\n' + val('f-envie') + '\n\n'
      + T.l_ex + '\n' + (val('f-exemple') || '…') + '\n\n'
      + T.l_fin + ',\n' + val('f-prenom');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    erreur.hidden = true;
    if (!form.checkValidity()) {
      var premier = form.querySelector(':invalid');
      erreur.textContent = T.manque;
      erreur.hidden = false;
      if (premier) premier.focus();
      return;
    }
    if (val('f-honey')) return;
    bouton.disabled = true;
    bouton.textContent = T.envoi;
    var sujet = T.sujet + val('f-prenom') + ', ' + val('f-marque') + (val('f-audience') ? ' · ' + val('f-audience') + ' abonnés' : '');
    var data = {
      access_key: CLE_WEB3FORMS, subject: sujet, from_name: 'Demandes clients', replyto: val('f-email'), botcheck: '',
      'La demande': texte(), 'Prénom': val('f-prenom'), 'Marque': val('f-marque'), 'Email': val('f-email'),
      'Abonnés actifs': val('f-audience') || '…', "Ce qu'il aimerait changer": val('f-envie'), 'Un de ses emails': val('f-exemple') || '…'
    };
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (res) { if (!r.ok || res.success !== true) throw new Error(res.message || ('HTTP ' + r.status)); }); })
      .then(function () { form.hidden = true; envoi.hidden = false; envoi.scrollIntoView({ block: 'center', behavior: calme ? 'auto' : 'smooth' }); })
      .catch(function (err) {
        try { console.warn('Demande non envoyée :', err && err.message); } catch (e2) {}
        bouton.disabled = false; bouton.innerHTML = LIBELLE;
        var lien = 'mailto:' + ADRESSE + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(texte());
        erreur.innerHTML = '';
        erreur.appendChild(document.createTextNode(T.rate));
        var a = document.createElement('a'); a.href = lien; a.textContent = T.lien;
        erreur.appendChild(a);
        erreur.appendChild(document.createTextNode(T.fin));
        erreur.hidden = false;
      });
  });
})();
