let restaurantsCache = 'restaurantsapp-cache-v1',
    restaurantsIDB = 'mws-restaurants',
    isAPIrequest = new RegExp(/(restaurants)$/);

//SW install
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(restaurantsCache).then(function(cache) {
          return cache.addAll([
            '/',
            '/dist/js/main.js',
            '/dist/js/restaurant_info.js',
            '/restaurant.html'
          ]);
        })
    );
});

//SW activate
self.addEventListener('activate', function(event) {
  event.waitUntil(
    _idbOpen()
  );
});

//SW fetch
self.addEventListener('fetch', function(event) {

  //if API request, do a network request for fresh data (and if succeeds save to DB) then fall back to IDB
  if(event.request.url.match(isAPIrequest)) {
    console.log("This is an API call: " + event.request.url);
    event.respondWith(
      fetch(event.request)
      .then(function(res) {
        let r = res.clone();
        res.json().then(restaurants => _idbOpen(db => _idbWrite(db, restaurants)));
        return r;
      })
      .catch(function(error){
        return new Promise(function(success, failure) {
          _idbOpen(db => _idbRead(db, restaurants => {
            let r = new Response(JSON.stringify(restaurants),
            {
              headers: { "Content-Type" : "application/json" }
            });
            success(r);
          }));  
        });
      })
      .then(res => {
        return res;
      })
    )
  }
  //if !API request, search in cache, otherwise ask to the network and cache then
  else {
    event.respondWith(
      caches.match(event.request, {ignoreSearch: true}) //search in cache
      .then(function(resp){
        return resp || fetch(event.request) //if not in cache then fall back to the network
        .then(function(response) {
          return (!event.request.url.endsWith('.jpg'))? response : caches.open(restaurantsCache)
          .then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });  
        })
      })
    );  
  }
  
});

//Open restaurants DB
function _idbOpen(success, error) {
  const r = indexedDB.open(restaurantsIDB, 1);
  r.onerror = error;
  r.onsuccess = (event => {if(success) success(event.target.result)}); //return the db handler
  r.onupgradeneeded = (event => {
    const restaurants_store = event.target.result.createObjectStore("restaurants", {keyPath: "id"}); //create the restaurants object store
    restaurants_store.createIndex("id", "id", {unique : true}); //create the index on the id key
    restaurants_store.transaction.oncomplete = (event => {if(success) success(event.target.result)}); //return the db handler
  });
}

//Write restaurants DB
function _idbWrite(db, restaurants) {
  const restaurants_store = db.transaction("restaurants", "readwrite").objectStore("restaurants"); //get the restaurants object store in r\w mode
  restaurants.forEach(restaurant => restaurants_store.put(restaurant)); //add or update if restaurant with that id exists
}

//Read restaurants DB
function _idbRead(db, callback) {
  let restaurants = [];
  const restaurants_store = db.transaction("restaurants").objectStore("restaurants"); //get the restaurants object store
  restaurants_store.openCursor().onsuccess = (event => { //iterate over the items
    let cursor = event.target.result;
    if(cursor) {
      restaurants.push(cursor.value);
      cursor.continue();
    } else callback(restaurants);
  });
}
