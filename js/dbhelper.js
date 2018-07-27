/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * IDB Database name
   */
  static get DATABASE_IDB_NAME() {
    return `mws-restaurants`
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    
    DBHelper._dbOpen(db => { //get stored restaurants data

      DBHelper._readRestaurants(db, restaurants => {
        callback(null, restaurants);
      });
    
      fetch(DBHelper.DATABASE_URL) //get fresh restaurants data
      .then(blob => blob.json())
      .then(restaurants => {
        DBHelper._dbOpen(db => { //save or update restaurants list in IDB
          DBHelper._saveRestaurants(restaurants, db);});
        callback(null, restaurants);
      })
      .catch(error => callback(`Request failed. Returned status of ${error}`, null));
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph)
      return (`./img/${restaurant.photograph}.jpg`);
    else
      return ('./img/default_icon.jpg');
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Open restaurants IDB
   */
  static _dbOpen(success, error) {
    const r = indexedDB.open(DBHelper.DATABASE_IDB_NAME, 1);
    r.onerror = error;
    r.onsuccess = (event => success(event.target.result)); //return the db handler
    r.onupgradeneeded = (event => {
      const restaurants_store = event.target.result.createObjectStore("restaurants", {keyPath: "id"}); //create the restaurants object store
      restaurants_store.createIndex("id", "id", {unique : true}); //create the index on the id key
      restaurants_store.transaction.oncomplete = (event => success(event.target.result)); //return the db handler
    });
  }

  /**
   * Save restaurants in the IDB  
   */
  static _saveRestaurants(restaurants, db) {
    const restaurants_store = db.transaction("restaurants", "readwrite").objectStore("restaurants"); //get the restaurants object store in r\w mode
    restaurants.forEach(restaurant => restaurants_store.put(restaurant)); //add or update if restaurant with that id exists
  }

  /** Read restaurants from IDB */
  static _readRestaurants(db, callback) {
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

}
