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

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "8d2e35e43c176a2282010894f9c4b996"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "8dffdb52d3a6ef68b2ab3a2cb43e643e"
  },
  {
    "url": "servicw-worker.js",
    "revision": "c8a671c2f70d6763c03d4fc10e051b3d"
  },
  {
    "url": "src/css/app.css",
    "revision": "fdb2aa4a8841d1d7c2d650e5c2447481"
  },
  {
    "url": "src/css/feed.css",
    "revision": "84520b7016e666d5cc3446b6f3b3dae7"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "cc30ed591e1c541e9de0166dc6684630"
  },
  {
    "url": "src/js/feed.js",
    "revision": "81fb91e7d982461bb5c0dccd1e56b4ee"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/material.min.js.map",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "85f92cdfb667517becc79d680574641f"
  },
  {
    "url": "sw-base.js",
    "revision": "8ce3a02715299e1e58cefe8a3bd7e78f"
  },
  {
    "url": "sw.js",
    "revision": "64247a30b78237bedd0dbb9a61468de4"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js.map",
    "revision": "1cbd1bf8f8f05f7504355e0f7674b67e"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

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
