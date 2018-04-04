self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v1').then(function(cache) {
          return cache.addAll([
            '/index.html',
            '/js/main.js',
            '/data/restaurants.json',
            '/img/'
          ]);
        })
      );
})