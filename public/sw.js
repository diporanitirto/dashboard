// Service worker: push notifications + basic cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'Notifikasi baru', body: '', url: '/' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    try { data.body = event.data.text(); } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notifikasi baru', {
      body: data.body || '',
      icon: '/icons-192.png',
      badge: '/icons-192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});