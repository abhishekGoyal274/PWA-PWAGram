const URL_REQUEST = "https://pwa-pwagram.onrender.com/storePostData";
var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");

var picture;
var fetchedlocation = { lat: 0, lng: 0 };
const form = document.getElementById("posts-form");
const titleValue = document.querySelector("#title");
const locValue = document.querySelector("#location");
const videoPlayer = document.querySelector("#player");
const canvasEle = document.querySelector("#canvas");
const captureButton = document.querySelector("#capture-btn");
const imagePicker = document.querySelector("#image-picker");
const pickImage = document.querySelector("#pick-image");
const locationBtn = document.querySelector("#location-btn");
const locationLoader = document.querySelector("#location-loader");
const manualLocation = document.querySelector("#manual-location");

locationBtn.addEventListener("click", (event) => {
  if (!("geolocation" in navigator)) {
    return;
  }
  locationBtn.style.display = "none";
  locationLoader.style.display = "block";
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      console.log("[Location]", position);
      locationLoader.style.display = "none";
      fetchedlocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const res =
        await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=1&appid=dc34adeecf23f3f332787f99e997a4e8
      `);
      const response = await res.json();
      locValue.value = response[0].name;
      manualLocation.classList.add("is-focused");
    },
    (err) => {
      console.log("[Error Location]", err);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      alert("Couldn,t fetch location");
      fetchedlocation = { lat: 0, lng: 0 };
    },
    { timeout: "8000" }
  );
});

function initLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

function initMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }
  console.log("[Somethings]",navigator.mediaDevices);
  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not implemented"));
      }
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
    })
    .catch((err) => {
      pickImage.style.display = "block";
    });
}

captureButton.addEventListener("click", (event) => {
  canvasEle.style.display = "block";
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";

  const context = canvasEle.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );
  videoPlayer.srcObject.getVideoTracks().forEach((track) => {
    track.stop();
  });
  picture = dataURItoBlob(canvasEle.toDataURL());
});

imagePicker.addEventListener("change", (event) => {
  picture = event.target.files[0];
  console.log(picture);
});

function sendData(post) {
  var postData = new FormData();
  postData.append("id", post.id);
  postData.append("title", post.title);
  postData.append("location", post.location);
  postData.append("rawLocationLat", fetchedlocation.lat);
  postData.append("rawLocationLng", fetchedlocation.lng);
  postData.append("file", data.picture, post.id + ".png");
  fetch(URL_REQUEST, {
    method: "POST",
    body: postData,
  })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const title = titleValue.value;
  const loc = locValue.value;
  if (title.trim() === "" || loc.trim() === "") {
    alert("please enetr valid value");
    return;
  }
  closeCreatePostModal();
  const post = {
    id: Date().toString(),
    title: title,
    location: loc,
    picture: picture,
    rawLocation: fetchedlocation,
  };
  console.log(post);
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((sw) => {
      writeData("sync-posts", post)
        .then(function () {
          sw.sync.register("sync-new-post");
        })
        .then(() => {
          var snackBar = document.querySelector("#confirmation-toast");
          var data = { message: "Your post was save for syncing" };
          snackBar.MaterialSnackbar.showSnackbar(data);
        })
        .catch(() => {
          var snackBar = document.querySelector("#confirmation-toast");
          var data = { message: "Syncing failed!" };
          snackBar.MaterialSnackbar.showSnackbar(data);
        });
    });
  } else {
    console.log("[Sync Manager Unavailable]...");
    sendData(post);
  }
});

function openCreatePostModal() {
  createPostArea.style.display = "block";
  initMedia();
  initLocation();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
  videoPlayer.style.display = "none";
  pickImage.style.display = "none";
  canvasEle.style.display = "none";
  captureButton.style.display = "inline";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
  try{
    if (videoPlayer.srcObject) {
      videoPlayer.srcObject.getVideoTracks().forEach((track) => {
        track.stop();
      });
    }
  }catch(err){
    console.log(err);
  }
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);
function onSaveButtonClicked(event) {
  if (!("caches" in window)) return;
  caches.open("user-cache").then((cache) => {
    cache.addAll(["https://httpbin.org/get", "/src/images/sf-boat.jpg"]);
  });
}

function clearCard() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  if (data.image === undefined)
    cardTitle.style.backgroundImage =
      "url(https://c4.wallpaperflare.com/wallpaper/815/737/246/abstract-1920x1200-nature-wallpaper-thumb.jpg)";
  else cardTitle.style.backgroundImage = `url(${data.image})`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "280px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.location;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.title;

  // var cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSupportingText.appendChild(cardSaveButton);
  // cardSaveButton.addEventListener("click", onSaveButtonClicked);

  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}
var fetchedOnServer = false;

function updateUICache(dataArray) {
  clearCard();
  for (var i = 0; i < dataArray.length; i++) createCard(dataArray[i]);
}
function updateUIServer(dataArray) {
  clearCard();
  for (var i = dataArray.length - 1; i >= 0; i--) createCard(dataArray[i]);
}

fetch(
  "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json"
)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    fetchedOnServer = true;
    console.log("[From Server]", data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUIServer(dataArray);
  })
  .catch((err) => {
    console.log("[Fetch Error]", err);
  });

if ("indexedDB" in window) {
  readAllData("posts").then((data) => {
    console.log("[IndexedDB Cache]", data);
    if (fetchedOnServer) {
      console.log("[IndexDB] Already got from Server");
      return;
    }
    updateUICache(data);
  });
}

// Cache stratergy
// if ("caches" in window) {
//   caches
//     .match(URL_REQUEST)
//     .then((res) => {
//       if (res) {
//         return res.json();
//       } else {
//         throw "Not cached";
//       }
//     })
//     .then((data) => {
//       if (fetchedOnServer) {
//         console.log("[From Cache] Already recieved by server");
//         return;
//       }
//       console.log("[From Cache]", data);
//       var dataArray = [];
//       for (var key in data) {
//         dataArray.push(data[key]);
//       }
//       updateUI(dataArray);
//     })
//     .catch((err) => console.log("[Cache Error]", err));
// }
