/* SOWLFY Service Worker */
const CACHE_VERSION = 'sowlfy-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

// Install event - cache essentials
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        // Try to cache each URL, ignore failures
        return Promise.all(
          URLS_TO_CACHE.map((url) =>
            cache.add(url).catch((err) => {
              console.log(`Failed to cache ${url}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests to 3rd party APIs
  if (request.url.includes('mercadolibre') || request.url.includes('firebaseio')) {
    return;
  }

  // Cache strategy: Network first for API, Cache first for static assets
  if (request.url.includes('/api/') || request.url.includes('firestore')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION)
              .then((cache) => cache.put(request, responseClone))
              .catch(() => {}); // Ignore cache errors
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => response || createOfflineResponse());
        })
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200 && response.type !== 'error') {
                const responseClone = response.clone();
                caches.open(CACHE_VERSION)
                  .then((cache) => cache.put(request, responseClone))
                  .catch(() => {}); // Ignore cache errors
              }
              return response;
            })
            .catch(() => createOfflineResponse());
        })
    );
  }
});

// Create offline fallback response
function createOfflineResponse() {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SOWLFY - Offline</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"><div style="text-align: center; color: white;"><h1>🦉 SOWLFY</h1><p>Você está offline</p><p style="font-size: 14px; opacity: 0.8;">Tente reconectar-se à internet para continuar</p></div></body></html>',
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  );
}

// Background sync para formulários offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(
      syncAnalytics()
    );
  }
});

// Sincroniza eventos de analítica quando reconectar
function syncAnalytics() {
  return new Promise((resolve) => {
    // Implementar sincronização de dados offline
    resolve();
  });
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificações push (básico)
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nova mensagem de SOWLFY',
    icon: '/assets/img/icon_sowlfy.png',
    badge: '/assets/img/icon_sowlfy.png',
    tag: 'sowlfy-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SOWLFY', options)
  );
});

// Click em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
