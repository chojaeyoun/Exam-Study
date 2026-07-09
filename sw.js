const CACHE_NAME = "exam-study-app-v73";
const APP_SHELL = [
  "./index.html",
  "./industrial_safety_study.html",
  "./manifest.webmanifest",
  "./icons/sushi-vinegar-icon.svg",
  "./industrial_safety_questions_template.csv"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isPageRequest =
    event.request.mode === "navigate" ||
    requestUrl.pathname.endsWith("/industrial_safety_study.html") ||
    requestUrl.pathname.endsWith("/index.html");

  if (isPageRequest) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then(cached => {
        return cached || caches.match("./industrial_safety_study.html");
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./industrial_safety_study.html"));
    })
  );
});
