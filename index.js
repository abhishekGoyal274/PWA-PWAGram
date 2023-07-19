const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
//Local server access
const path = require("path");
var fs = require("fs");
//Image save
const firebase = require("firebase-admin");
const uuid = require("uuid-v4");
const multer = require("multer");
//Notifications
const webpush = require("web-push");

// Database API
const serviceAccount = require("/etc/secrets/pwa-course-79727.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL:
    "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "pwa-course-79727.appspot.com",
});

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json({ extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const storageEngine = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
  },
});
const checkFileType = function (file, cb) {
  const fileTypes = /jpeg|jpg|png/;
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);
  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb("Error: You can Only Upload Images With extension jpeg ,jpg ,or png !!");
  }
};
const upload = multer({
  storage: storageEngine,
  limits: { fileSize: 3000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

app.post("/storePostData", upload.single("file"), async (request, response) => {
  console.log(request.body);
  var bucket = firebase.storage().bucket();
  var filename = `uploads/${request.file.filename}`;
  let image =
    "https://firebasestorage.googleapis.com/v0/b/pwa-course-79727.appspot.com/o/unnamed.jpg?alt=media&token=41f64341-ae14-4a36-a2a6-01f5b341b3ba";
  async function uploadFile() {
    const metadata = {
      metadata: {
        firebaseStorageDownloadTokens: uuid(),
      },
      contentType: "image/jpg",
      cacheControl: "public, max-age=31536000",
    };

    const data = await bucket.upload(filename, {
      gzip: true,
      metadata: metadata,
    });
    image = data[0].metadata.mediaLink;
    console.log(`${filename} uploaded.`);
  }
  await uploadFile()
    .then((res) => {
      fs.unlink(`uploads/${request.file.filename}`, function (err) {
        if (err) console.log(err);
        else console.log("file deleted successfully");
      });
      // response.write("file uploaded");
    })
    .catch((error) => {
      console.log("Error");
      // response.send(error);
    });

  firebase
    .database()
    .ref("posts")
    .push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      rawLocation: {
        lat: request.body.rawLocationLat,
        lng: request.body.rawLocationLng,
      },
      image: image,
    })
    .then(function () {
      return firebase.database().ref("subscriptions").once("value");
    })
    .then(function (subscriptions) {
      subscriptions.forEach(function (sub) {
        var pushConfig = {
          endpoint: sub.val().endpoint,
          keys: {
            auth: sub.val().keys.auth,
            p256dh: sub.val().keys.p256dh,
          },
        };
        const pubkey =
          "BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE";
        const privkey = "AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s";
        const options = {
          TTL: 24 * 60 * 60,
          vapidDetails: {
            subject: "https://pwa-course-79727.web.app",
            publicKey: pubkey,
            privateKey: privkey,
          },
        };

        webpush
          .sendNotification(
            pushConfig,
            JSON.stringify({
              title: "New Post",
              content: "New Post added!",
              openUrl: "/",
            }),
            options
          )
          .then((res) => {
            console.log("[Success]");
          })
          .catch(function (err) {
            console.log("[Error in Web Push]");
          });
      });
      response.status(201).json({
        message: "Data stored",
        id: request.body.id,
      });
    })
    .catch(function (err) {
      response.status(500).json({ error: err });
    });
});

const port = 5000 || process.env.PORT;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
