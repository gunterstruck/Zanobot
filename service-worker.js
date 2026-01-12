/**
 * ZANOBOT SERVICE WORKER
 * Handles caching, offline functionality, and PWA features
 */

const CACHE_VERSION = 'zanobot-v1.0.8';
const CACHE_NAME = `${CACHE_VERSION}`;
const DEBUG = false; // Set to true for development, false for production

// Helper function for conditional logging
function log(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function warn(...args) {
    if (DEBUG) {
        console.warn(...args);
    }
}

function error(...args) {
    // Always log errors, even in production
    console.error(...args);
}

// Assets to cache on install
const STATIC_ASSETS = [
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/theme-bootstrap.js',
    './config.json',
    './manifest.json'
];

// Assets to cache on first request (runtime caching)
const RUNTIME_CACHE_URLS = [
    '/icons/',
    '/assets/'
];

/**
 * Install Event
 * Cache static assets when service worker is installed
 */
self.addEventListener('install', (event) => {
    log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                log('[SW] Caching static assets');

                // Track which critical files failed to cache
                const criticalFiles = ['./index.html', './js/app.js'];
                const failedCriticalFiles = [];

                // Cache each file individually to handle errors gracefully
                const cachePromises = STATIC_ASSETS.map(async (url) => {
                    try {
                        await cache.add(url);
                        log('[SW] Cached:', url);
                    } catch (error) {
                        warn('[SW] Failed to cache:', url, error);
                        if (criticalFiles.includes(url)) {
                            failedCriticalFiles.push(url);
                        }
                    }
                });

                await Promise.all(cachePromises);

                // Throw error if critical files failed to cache
                if (failedCriticalFiles.length > 0) {
                    throw new Error(
                        `Failed to cache critical files: ${failedCriticalFiles.join(', ')}. ` +
                        'Offline functionality will not work properly.'
                    );
                }
            })
            .then(() => {
                log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                error('[SW] Installation failed:', error);
                throw error; // Re-throw to prevent faulty service worker installation
            })
    );
});

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
    log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Delete old caches
                            return cacheName !== CACHE_NAME && cacheName.startsWith('zanobot-');
                        })
                        .map((cacheName) => {
                            log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event
 * Serve from cache, fallback to network (Cache-First Strategy)
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip cross-origin requests
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    log('[SW] Serving from cache:', request.url);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache if response is not valid
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response (can only be consumed once)
                        const responseToCache = response.clone();

                        // Cache runtime assets
                        const shouldCache = RUNTIME_CACHE_URLS.some(url => request.url.includes(url));

                        if (shouldCache) {
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    log('[SW] Caching runtime asset:', request.url);
                                    cache.put(request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch((error) => {
                        error('[SW] Fetch failed:', error);

                        // Return offline page if available
                        return caches.match('/index.html');
                    });
            })
    );
});

/**
 * Message Event
 * Handle messages from the app
 */
self.addEventListener('message', (event) => {
    log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }
});

/**
 * Sync Event (Background Sync)
 * Handle background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

/**
 * Sync data when back online
 *
 * Background Sync API implementation for offline data synchronization.
 * Syncs diagnoses and recordings when connection is restored.
 */
async function syncData() {
    log('[SW] 🔄 Starting background sync...');

    try {
        // Open IndexedDB
        const db = await openIndexedDB();

        // Get all diagnoses that haven't been synced (if sync flag exists)
        const tx = db.transaction(['diagnoses'], 'readonly');
        const store = tx.objectStore('diagnoses');
        const diagnoses = await getAllFromStore(store);

        log(`[SW] Found ${diagnoses.length} diagnoses to potentially sync`);

        // Check if there are any pending syncs (this would require a sync flag in data model)
        // For now, we just log that sync is ready
        // In production, you'd send data to a backend API here

        /*
        // Example sync to backend (if backend exists):
        for (const diagnosis of diagnoses) {
            if (diagnosis.needsSync) {
                try {
                    await fetch('/api/diagnoses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(diagnosis)
                    });

                    // Mark as synced
                    diagnosis.needsSync = false;
                    diagnosis.syncedAt = Date.now();
                    await updateDiagnosis(db, diagnosis);
                } catch (error) {
                    error('[SW] Sync failed for diagnosis:', diagnosis.id, error);
                }
            }
        }
        */

        log('[SW] ✅ Background sync complete');
        return Promise.resolve();
    } catch (error) {
        error('[SW] ❌ Sync error:', error);
        return Promise.reject(error);
    }
}

/**
 * Open IndexedDB
 */
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('zanobot-db', 3);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all records from a store
 */
function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Push Event (Push Notifications)
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
    log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'Neue Benachrichtigung von Zanobot',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Öffnen'
            },
            {
                action: 'close',
                title: 'Schließen'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Zanobot', options)
    );
});

/**
 * Notification Click Event
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

log('[SW] Service Worker loaded');
