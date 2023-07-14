const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const firebase = require("firebase-admin");
const webpush = require("web-push");
const multer = require("multer");

// Database API
const serviceAccount = require("/pwa-course-79727.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL:
    "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json({ extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/uploads", express.static("uploads"));
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
    cb("Error: You can Only Upload Images!!");
  }
};
const upload = multer({
  storage: storageEngine,
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

app.get("/", (req,res)=>{
  res.send("hello");
});

app.post("/storePostData", upload.single("file"), (request, response) => {
  let image;
  try {
    image =
      "http://" + request.headers.host + "/uploads/" + request.file.filename;
  } catch (err) {
    image = "http://" + request.headers.host + "/uploads/default.png";
  }
  console.log(request.body);
  firebase
    .database()
    .ref("posts")
    .push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      rawLocation : {
        lat : request.body.rawLocationLat,
        lng : request.body.rawLocationLng
      },
      image: image,
    })
    .then(function () {
      webpush.setVapidDetails(
        "mailto:business@academind.com",
        "BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE",
        "AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s"
      );
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

        webpush
          .sendNotification(
            pushConfig,
            JSON.stringify({
              title: "New Post",
              content: "New Post added!",
              openUrl: "/",
            })
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
