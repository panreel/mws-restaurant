var restaurantsCacheName = 'restaurantsapp-cache-v1';

//SW install
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(restaurantsCacheName).then(function(cache) {
          return cache.addAll([
            '/',
            '/js/dbhelper.js',
            '/js/main.js',
            '/js/restaurant_info.js',
            '/css/styles.css',
            '/css/styles-medium.css',
            '/css/styles-large.css',
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
