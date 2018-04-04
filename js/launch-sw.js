//Launch the Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {scope: '/'})
  .then(function(reg) {
    //Registration worked
    console.log('[SW] Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    //Registration failed
    console.log('[SW] Registration failed with ' + error);
  });
}