const URL_REQUEST =
  "https://pwa-pwagram.onrender.com/storePostData";
importScripts("src/js/idb.js");
importScripts("src/js/utility.js");

const CACHE_STATIC_VERSION = "static-v29";
const CACHE_DYNAMIC_VERSION = "dynamic-v8";
const CACHE_DYNAMIC_LIMIT = 300;

function trimCache(name, maxItems) {
  caches.open(name).then((cache) => {
    return cache.keys().then((keys) => {
      if (keys.length > 0 && keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(name, maxItems));
      }
    });
  });
}

self.addEventListener("install", function (event) {
  // console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches
      .open(CACHE_STATIC_VERSION)
      .then((cahce) => {
        console.log("[Service Worker] Caching shell ...");
        const requests = [
          "/",
          "/offline.html",
          "/index.html",
          "/src/js/app.js",
          "/src/js/feed.js",
          "/src/js/idb.js",
          "/src/js/utility.js",
          "/src/js/fetch.js",
          "/src/js/promise.js",
          "/src/js/material.min.js",
          "/src/css/app.css",
          "/src/css/help.css",
          "/src/css/feed.css",
          "/src/images/main-image.jpg",
          "https://fonts.googleapis.com/css?family=Roboto:400,700",
          "https://fonts.googleapis.com/icon?family=Material+Icons",
          "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
        ];
        cahce.addAll(requests);
      })
      .catch((err) => {
        console.warn(err);
      })
  );
});

self.addEventListener("activate", function (event) {
  // console.log("[Service Worker] Activating Service Worker ....", event);
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        // console.log("[Service Worker] Cache keys", keyList);
        return Promise.all(
          keyList.map((key) => {
            if (
              key != CACHE_STATIC_VERSION &&
              key != CACHE_DYNAMIC_VERSION &&
              key != "user-cache"
            ) {
              // console.log("[Service Worker] Removing Old Cache Keys", key);
              return caches.delete(key);
            }
          })
        );
      })
      .catch((err) => {
        console.log("[Service Worker] Error Getting Keys..");
      })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (
    event.request.url.indexOf(
      "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json"
    ) > -1
  ) {
    event.respondWith(
      fetch(event.request, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      })
        .then((res) => {
          console.log("[IndexDB Caching]", event.request.url);
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
        })
        .catch((err) => {
          console.log("[Service Worker] Error refreshing page...");
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((res) => {
        if (res) return res;
        return fetch(event.request)
          .then((res) => {
            return caches.open(CACHE_DYNAMIC_VERSION).then((cache) => {
              trimCache(CACHE_DYNAMIC_VERSION, CACHE_DYNAMIC_LIMIT);
              cache.put(event.request.url, res.clone());
              return res; 
            });
          })
          .catch((err) => {
            return caches.open(CACHE_STATIC_VERSION).then((cache) => {
              if (event.request.headers.get("accept").includes("text/html")) {
                return cache.match("/offline.html");
              }
            });
          });
      })
    );
  }
});

self.addEventListener("sync", function (event) {
  console.log("[Sync Data]", event);
  if (event.tag === "sync-new-post") {
    event.waitUntil(
      readAllData("sync-posts").then((dt) => {
        for (var data of dt) {
          var postData = new FormData();
          postData.append("id" , data.id);
          postData.append("title" , data.title);
          postData.append("location" , data.location);
          postData.append("rawLocationLat", data.rawLocation.lat);
          postData.append("rawLocationLng", data.rawLocation.lng);
          postData.append("file" , data.picture, dt.id+'.png');
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
      clients.matchAll()
      .then((clis)=>{
        const client = clis.find((c)=>{
          return c.visibilityState === 'visible';
        })
        if(client !== undefined){
          client.navigate(notification.data.url);
          client.focus();
        }else{
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
    openUrl :"/"
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  const options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    image: "/src/images/sf-boat.jpg",
    data: {
      url: data.openUrl
    }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
