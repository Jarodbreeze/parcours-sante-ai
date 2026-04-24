// ParcourSante AI — Service Worker v1.2
// Cache statique pour fonctionnement hors ligne

var CACHE_NAME = "parcoursante-v1";
var FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./parcours_sante_ai.html",
  "./ps_design.css",
  "./mediasante_famo.html",
  "./mediasante_courriers.html",
  "./mediasante_staff_ia.html",
  "./mediasante_staff_prep.html",
  "./mediasante_premiere_visite.html",
  "./mediasante_transmissions.html",
  "./mediasante_orientation.html",
  "./mediasante_dashboard.html",
  "./mediasante_agenda.html",
  "./mediasante_fiche_patient.html",
  "./mediasante_carte_mentale.html",
  "./mediasante_carte_patients.html",
  "./mediasante_dac_france.html",
  "./mediasante_transport.html",
  "./mediasante_protection_juridique.html",
  "./mediasante_contacts.html",
  "./mediasante_bilan.html",
  "./mediasante_dictee.html",
  "./mediasante_risque.html",
  "./mediasante_questionnaire.html",
  "./mediasante_messagerie.html",
];

// Installation — mise en cache de tous les fichiers
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("[SW] Mise en cache des fichiers...");
      return cache.addAll(FILES_TO_CACHE);
    }).then(function() {
      console.log("[SW] Tous les fichiers en cache");
      return self.skipWaiting();
    })
  );
});

// Activation — nettoyer les anciens caches
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if(key !== CACHE_NAME) {
          console.log("[SW] Suppression ancien cache:", key);
          return caches.delete(key);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — servir depuis le cache, fallback réseau
self.addEventListener("fetch", function(event) {
  // Ignorer les requêtes non-GET et les requêtes API externes
  if(event.request.method !== "GET") return;
  if(event.request.url.includes("api.anthropic.com")) return;
  if(event.request.url.includes("fonts.googleapis.com")) return;
  if(event.request.url.includes("fonts.gstatic.com")) return;

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if(response) {
        // Servir depuis le cache (hors ligne)
        return response;
      }
      // Pas en cache — essayer le réseau
      return fetch(event.request).then(function(networkResponse) {
        // Mettre en cache la réponse réseau pour la prochaine fois
        if(networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Réseau indisponible et pas en cache — page hors ligne générique
        return new Response(
          "<html><body style='font-family:sans-serif;padding:30px;text-align:center'>" +
          "<h2>Hors ligne</h2><p>Ce fichier n est pas encore en cache. Reconnectez-vous pour le charger.</p>" +
          "<button onclick='location.reload()'>Reessayer</button>" +
          "</body></html>",
          {headers: {"Content-Type": "text/html"}}
        );
      });
    })
  );
});

// Message pour forcer la mise à jour du cache
self.addEventListener("message", function(event) {
  if(event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
