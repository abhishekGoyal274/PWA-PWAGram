const enableNotification = document.querySelectorAll(".enable-notifications");
var deferredPrompt;

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/servicw-worker.js")
    .then(function () {
      console.log("Service worker registered!");
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  // console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayNotification(message) {
  if (!"serviceWorker" in navigator) {
    new Notification("Notification Service Not Available");
  }
  const options = {
    body: "You Successfully subscribed to our notification services.(SW)",
    icon: "/src/images/icons/app-icon-96x96.png",
    image: "/src/images/sf-boat.jpg",
    openUrl: "/",
    badge: "/src/images/icons/app-icon-96x96.png",
    tag: "confirm-notification",
    renotify: true,
    dir: "ltr",
    actions: [
      {
        action: "confirm",
        title: "open",
      },
      {
        action: "cancel",
        title: "Cancel",
      },
    ],
  };
  navigator.serviceWorker.ready.then((sw) => {
    sw.showNotification(message, options);
  });
}

async function configureSubscribe() {
  if (!"serviceWorker" in navigator) {
    console.log("[No Service Worker]");
    return;
  }

  const swReg = await navigator.serviceWorker.ready;
  const sub = await swReg.pushManager.getSubscription();
  if (sub !== null) {
    console.log("[Already Subs]");
    return;
  }

  // Create a new Subscription
  const publicKey =
    "BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE";
  // const convertdPK = urlBase64ToUint8Array(publicKey);
  const newSubscription = await swReg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });

  const res = await fetch(
    "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app/subscriptions.json",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(newSubscription),
    }
  );
  console.log("[Subscription]", res);
  if (res.ok) {
    displayNotification("Permission Granted!");
  }
}

function notificationPermission() {
  Notification.requestPermission((result) => {
    if (result !== "granted") {
      console.log("Not granted");
    } else {
      console.log("granted");
      configureSubscribe();
    }
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  console.log("[Notifications Avalable]");
  for (let index = 0; index < enableNotification.length; index++) {
    enableNotification[index].style.display = "inline-block";
    enableNotification[index].addEventListener("click", notificationPermission);
  }
} else {
  console.log("[Notifications Not Avalable]");
}
