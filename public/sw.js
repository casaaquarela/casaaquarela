// Service Worker simplificado - sem cache que interfere
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
// Não intercepta nenhum fetch - deixa tudo passar normalmente
