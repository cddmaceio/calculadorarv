// Service Worker utilities for PWA compatibility
// This file helps manage cache conflicts and ensures data persistence

const CACHE_NAME = 'calculadora-rv-v1';
const DATA_CACHE_NAME = 'calculadora-rv-data-v1';

// URLs to cache for offline functionality
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event: any) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static resources');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Service Worker: Cache installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests differently
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response for caching
          const responseClone = response.clone();
          
          // Cache successful API responses
          if (response.status === 200) {
            caches.open(DATA_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Handle static resources
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request);
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Message event - handle cache management commands
self.addEventListener('message', (event: any) => {
  const { data } = event;
  
  if (data && data.type === 'CLEAR_CACHE') {
    console.log('🧹 Service Worker: Clearing caches...');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('✅ Service Worker: All caches cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (data && data.type === 'SKIP_WAITING') {
    console.log('⏭️ Service Worker: Skipping waiting...');
    (self as any).skipWaiting();
  }
});

// Export utility functions for main app
export const clearServiceWorkerCache = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    } else {
      resolve(false);
    }
  });
};

export const registerServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered successfully:', registration.scope);
            resolve(registration);
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
            resolve(null);
          });
      });
    } else {
      console.log('❌ Service Worker not supported');
      resolve(null);
    }
  });
};

export const unregisterServiceWorker = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister().then((success) => {
            console.log(success ? '✅ Service Worker unregistered' : '❌ Service Worker unregister failed');
            resolve(success);
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker unregister error:', error);
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
};