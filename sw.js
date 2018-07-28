var restaurantsCacheName = 'restaurantsapp-cache-v1';

//SW install
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(restaurantsCacheName).then(function(cache) {
          return cache.addAll([
            '/',
            '/dist/js/main.js',
            '/dist/js/restaurant_info.js',
            '/data/restaurants.json',
            '/restaurant.html',
          ]);
        })
    );
});

//SW fetch
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(function(resp) {
      return resp || fetch(event.request).then(function(response) {
        return (!event.request.url.endsWith('.jpg'))? response : caches.open(restaurantsCacheName).then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });  
      })
    })
  )
});
