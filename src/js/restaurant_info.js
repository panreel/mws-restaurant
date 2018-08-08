import './launch-sw'
import DBHelper from './dbhelper.js'
import './../css/styles.css'
import './../css/styles-large.css'
import './../css/styles-medium.css'

let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  //register the listener
  document.getElementById('new-review-submit').addEventListener('click', submitReview);
  //populate page data
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL(callback){
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
function fillRestaurantHTML(restaurant = self.restaurant){
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.tabIndex = 0;
  image.alt = 'A ' + restaurant.name + ' restaurant picture';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours = self.restaurant.operating_hours){
  const hours = document.getElementById('restaurant-hours');
  hours.tabIndex = 0;
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews = self.restaurant.reviews) {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review){
  const li = document.createElement('article');
  li.tabIndex = 0;
  const name = document.createElement('h3');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant=self.restaurant){
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Extract review form and export to JSON
 */
function getReviewForm() {
  return {
    name: document.getElementById('new-review-reviewer').value,
    rating: document.querySelector('#new-review-rating input:checked').value,
    comments: document.getElementById('new-review-comments').value
  }
}

/**
 * Validate a form is not empty
 */
function validateForm() {
  return 
  (document.getElementById('new-review-reviewer').value != "") &&
  (document.querySelector('#new-review-rating input:checked') != null) &&
  (ocument.getElementById('new-review-comments').value != "");
}

/**
 * Clear review form
 */
function clearReviewForm() {
  document.getElementById('new-review-reviewer').value = '';
  document.getElementById('new-review-rating').value = '';
  document.getElementById('new-review-comments').value = '';
}

/**
 * Show error form message
 */


/**
 * Submit review
 */
function submitReview() {
  if(validateForm()) {
    const form = getReviewForm();
    const id = getParameterByName('id');
    console.log(form);
  } else {
    console.log("Show error!");
  }
}

/**
 * Get a parameter by name from page URL.
 */
function getParameterByName(name, url){
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
