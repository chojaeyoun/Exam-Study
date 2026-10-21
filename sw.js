const CACHE_NAME = "exam-study-app-v155";
const APP_SHELL = [
  "./index.html",
  "./app.css?v=155",
  "./app-config.js?v=155",
  "./app-config-public.js?v=155",
  "./app.js?v=155",
  "./local-ai.js?v=155",
  "./industrial_safety_study.html",
  "./industrial_safety_study_public.html",
  "./manifest.webmanifest",
  "./manifest_public.webmanifest",
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
    requestUrl.pathname.endsWith("/industrial_safety_study_public.html") ||
    requestUrl.pathname.endsWith("/index.html");

  if (isPageRequest) {
    // GitHub Pages가 HTML을 10분 캐시하라고 보내서, 그대로 받으면 업데이트 직후에도 옛 화면이 뜸 -> 항상 서버에 확인
    event.respondWith(
      fetch(event.request.url, { cache: "no-cache", credentials: "same-origin" }).then(response => {
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
