const restaurantsCache = 'restaurantsapp-cache-v1',
    restaurantsIDB = 'mws-restaurants',
    isRestaurantAPIRequest = new RegExp(/restaurants|restaurants\/[0-9]+\/\?is_favourite=(true|false)$/);
    isReviewAPIRequest = new RegExp(/reviews/),
    DB_RESTAURANTS_MODE = 'restaurants',
    DB_REVIEWS_MODE = 'reviews';

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
  const _apiReq = event.request.url.match(isRestaurantAPIRequest),
        _revReq = event.request.url.match(isReviewAPIRequest);
  if(_apiReq || _revReq) {
    //check for network mode
    let mode = (_apiReq)? DB_RESTAURANTS_MODE : DB_REVIEWS_MODE;
      let _id = null;
    if(mode == DB_REVIEWS_MODE)
      _id = (new URL(event.request.url)).searchParams.get("restaurant_id");
      console.log("We have an ID: " + _id);
    console.log("This is an API call: " + event.request.url);
    event.respondWith(
      fetch(event.request)
      .then(function(res) {
        let r = res.clone();
        res.json().then(data => _idbOpen(db => _idbWrite(db, mode, data)));
        return r;
      })
      .catch(function(error){
        console.log("NO CONNECTION");
        return new Promise(function(success, failure) {
          _idbOpen(db => _idbRead(db, mode, data => {
            let r = new Response(JSON.stringify(data),
            {
              headers: { "Content-Type" : "application/json" }
            });
            success(r);
          }, _id));  
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
    const restaurants_store = event.target.result.createObjectStore(DB_RESTAURANTS_MODE, {keyPath: "id"}); //create the restaurants object store
    restaurants_store.createIndex("id", "id", {unique : true}); //create the index on the id key
    const reviews_store = event.target.result.createObjectStore(DB_REVIEWS_MODE, {keyPath: "id"}); //create the restaurants object store
    reviews_store.createIndex("id", "id", {unique : true}); //create the index on the id key
    event.target.transaction.oncomplete = (event => {if(success) success(event.target.result)}); //return the db handler
  });
}

//Write restaurants DB
function _idbWrite(db, mode, data) {
  const data_store = db.transaction(mode, "readwrite").objectStore(mode); //get the restaurants object store in r\w mode
  if(mode === DB_RESTAURANTS_MODE && !(data instanceof Array)) data = [data];
  if(mode === DB_REVIEWS_MODE && data[0] !== null) data = [{id: data[0].restaurant_id, reviews: data}];
  data.forEach(item => data_store.put(item)); //add or update if restaurant with that id exists
}

//Read restaurants DB
function _idbRead(db, mode, callback, id) {
  console.log("We have a read ID: " + id);
  const data_store = db.transaction(mode).objectStore(mode); //get the restaurants object store
      let data = [];
      data_store.openCursor().onsuccess = (event => { //iterate over the items
      let cursor = event.target.result;
      if(cursor) {
        let x = cursor.value;
        console.log(x);
        console.log("Check the mode: " + mode + ", id: " + x.id);
        if(mode == DB_REVIEWS_MODE && id == x.id) {
          console.log(x);
          console.log(x.reviews);
          callback(x.reviews);
          return;
        } else 
          data.push(cursor.value);
        cursor.continue();
      }
      else callback(data);
    });
}
