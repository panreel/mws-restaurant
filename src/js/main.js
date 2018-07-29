import './launch-sw'
import DBHelper from './dbhelper.js'
import './../css/styles.css'
import './../css/styles-large.css'
import './../css/styles-medium.css'

let self = {
  restaurants: [],
  neighborhoods: [],
  cuisines: [],
  map: null,
  markers: []
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  Promise.all([fetchNeighborhoods(),fetchCuisines()])
    .then(updateRestaurants);
});

/**
 * Show map after button click
 */
document.querySelector("#showmap").addEventListener('click', (event) => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  //Make GMaps accessible
  updateRestaurants();
})

/**
 * Fetch all neighborhoods and set their HTML.
 */
function fetchNeighborhoods(){
  return new Promise(function(resolve, reject) {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
      if (error) { // Got an error
        reject(error);
      } else {
        self.neighborhoods = neighborhoods;
        fillNeighborhoodsHTML();
        resolve(neighborhoods);
      }
    });
  })
}

/**
 * Set neighborhoods HTML.
 */
function fillNeighborhoodsHTML (neighborhoods = self.neighborhoods){
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
function fetchCuisines(){
  return new Promise(function(resolve, reject) {
    DBHelper.fetchCuisines((error, cuisines) => {
      if (error) { // Got an error!
        reject(error);
      } else {
        self.cuisines = cuisines;
        fillCuisinesHTML();
        resolve(cuisines);
      }
    });
  });
}

/**
 * Set cuisines HTML.
 */
function fillCuisinesHTML(cuisines = self.cuisines){
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  
}

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants(){
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      createObserver();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants){
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML(restaurants = self.restaurants){
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if(self.map) addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant){
  const li = document.createElement('article');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = 'A ' + restaurant.name + ' restaurant picture';
  li.append(image);

  const name = document.createElement('h2');
  name.tabIndex = 0;
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.tabIndex = 0;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.tabIndex = 0;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', 'View more details for ' + restaurant.name + ' restaurant');
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap(restaurants = self.restaurants){
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * Create observer to display lazy-loading images
 */
function createObserver(){
  const images = document.querySelectorAll('.restaurant-img');  
  //The observer for the images on the page
  const observer = new IntersectionObserver(
    (entries) => {
      // Loop through the entries
      entries.forEach(entry => {
        // Are we in viewport?
        if (entry.intersectionRatio > 0) {
          // Stop watching and load the image
          observer.unobserve(entry.target);
          preloadImage(entry.target);
        }
      });
    }, 
    {
      rootMargin: '0px',
      threshold: '0.01'
    });
  
  images.forEach(image => {
    observer.observe(image);
  });

}

/**
 * Show the image, map the data-src attrib to the src attrib
 */
function preloadImage(img){
  img.src = img.getAttribute('data-src');
}