importScripts("workbox-sw.prod.v2.1.3.js");
importScripts("src/js/idb.js");
importScripts("src/js/utility.js");

const workboxSW = new self.WorkboxSW();
const URL_REQUEST = "https://pwa-pwagram.onrender.com/storePostData";

// google-fonts
workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "google-fonts",
    cacheExpiration: {
      maxEntries: 5,
      maxAgeSeconds: 60 * 60 * 24 * 7,
    },
  })
);

// post-images
workboxSW.router.registerRoute(
  /.*(?:localhost:5000).*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "post-images",
  })
);

// material-css
workboxSW.router.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "material-css",
  })
);

// IndexDB fetch photos
workboxSW.router.registerRoute(
  "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json",
  function (args) {
    return fetch(args.event.request).then((res) => {
      const response = res.clone();
      clearAllData("posts")
        .then(() => {
          return response.json();
        })
        .then((data) => {
          for (var key in data) {
            writeData("posts", data[key]);
          }
        });
      return res;
    });
    //   .catch((err) => {
    //     console.log("[Service Worker] Error refreshing page...");
    //     return err;
    //   });
  }
);

// Fallback Offline
workboxSW.router.registerRoute(
  function (routeData) {
    return routeData.event.request.headers.get("accept").includes("text/html");
  },
  function (args) {
    return caches.match(args.event.request).then((res) => {
      if (res) {
        console.log(res);
        return res;
      }
      return fetch(args.event.request)
        .then((res) => {
          return caches.open("dynamic").then((cache) => {
            cache.put(args.event.request.url, res.clone());
            return res;
          });
        })
        .catch((err) => {
          return caches.match("/offline.html").then((res) => {
            return res;
          });
        });
    });
  }
);

workboxSW.precache([]);

self.addEventListener("sync", function (event) {
  console.log("[Sync Data]", event);
  if (event.tag === "sync-new-post") {
    event.waitUntil(
      readAllData("sync-posts").then((dt) => {
        for (var data of dt) {
          var postData = new FormData();
          postData.append("id", data.id);
          postData.append("title", data.title);
          postData.append("location", data.location);
          postData.append("rawLocationLat", data.rawLocation.lat);
          postData.append("rawLocationLng", data.rawLocation.lng);
          postData.append("file", data.picture, dt.id + ".png");
          fetch(URL_REQUEST, {
            method: "POST",
            body: postData,
          })
            .then((res) => {
              if (res.ok) {
                res.json().then(function (resData) {
                  console.log("[Data Sent]", resData);
                  deleteItemData("sync-posts", resData.id);
                });
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was Choosen");
  } else {
    event.waitUntil(
      clients.matchAll().then((clis) => {
        const client = clis.find((c) => {
          return c.visibilityState === "visible";
        });
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
      })
    );
    console.log("Cancel was Choosen");
  }
  notification.close();
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Notification Closed]", event);
});

self.addEventListener("push", (event) => {
  console.log("[Notification Successfull]", event);
  var data = {
    title: "dummy",
    content: "dummy",
    openUrl: "/",
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  const options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    image: "/src/images/sf-boat.jpg",
    data: {
      url: data.openUrl,
    },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
