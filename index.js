const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const firebase = require("firebase-admin");
const webpush = require("web-push");
const multer = require("multer");

// Database API

function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const serviceAccount = require("/etc/secrets/pwa-course-79727.json");
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

app.post("/storePostData", upload.single("file"), (request, response) => {
  let image;
  try {
    image =
      "https://" + request.headers.host + "/uploads/" + request.file.filename;
  } catch (err) {
    image = "https://" + request.headers.host + "/uploads/default.jpg";
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
     console.log("1");
      const  pubkey = urlBase64ToUint8Array("BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE");
      const  privkey = urlBase64ToUint8Array("AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s");
      webpush.setVapidDetails(
        "mailto:abhishekgoyal274@gmail.com",
        pubkey,
        privkey
      );
      console.log("2");
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
      console.log(err);
      response.status(500).json({ error: err });
    });
});

// My Code
// try {
//   console.log(req.body);
//   const post = {
//     id: req.body.id,
//     image: req.body.image,
//     title: req.body.title,
//     location: req.body.location,
//   };
//   const random =
//     "posts/" + req.body.id + Math.random().toString(36).substring(2, 13);
//   const response = await firebase.database().ref(random).set(post);
//   res.send(response);
// } catch (error) {
//   res.send(error);
// }
// });
  // var uuid = UUID();
  // console.log(request.file);
  // console.log(request.body);
  // const busboy = Busboy({ headers: request.headers });
  // // These objects will store the values (file + fields) extracted from busboy
  // let upload;
  // const fields = {};
  // // This callback will be invoked for each file uploaded
  // busboy.on("file", (name, file, info) => {
  //   const { filename, encoding, mimetype } = info;
  //   // console.log(
  //   // `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
  //   // );
  //   const filepath = path.join(os.tmpdir(), filename);
  //   upload = { file: filepath, type: mimetype };
  //   file.pipe(fs.createWriteStream(filepath));
  // });

  // // This will invoked on every field detected
  // busboy.on(
  //   "field",
  //   function (
  //     fieldname,
  //     val,
  //     fieldnameTruncated,
  //     valTruncated,
  //     encoding,
  //     mimetype
  //   ) {
  //     fields[fieldname] = val;
  //   }
  // );

  // // This callback will be invoked after all uploaded files are saved.
  // busboy.on("finish", () => {
  //   var bucket = gcs.bucket("pwa-course-79727.appspot.com");
  //   bucket.upload(
  //     upload.file,
  //     {
  //       uploadType: "media",
  //       metadata: {
  //         metadata: {
  //           contentType: upload.type,
  //           firebaseStorageDownloadTokens: uuid,
  //         },
  //       },
  //     },
  //     function (err, uploadedFile) {
  //       if (!err) {
  //         admin
  //           .database()
  //           .ref("posts")
  //           .push({
  //             id: fields.id,
  //             title: fields.title,
  //             location: fields.location,
  //             image:
  //               "https://firebasestorage.googleapis.com/v0/b/" +
  //               bucket.name +
  //               "/o/" +
  //               encodeURIComponent(uploadedFile.name) +
  //               "?alt=media&token=" +
  //               uuid,
  //           })
  //           .then(function () {
  //             webpush.setVapidDetails(
  //               "mailto:abhishekgoyal274@gmail.com",
  //               "BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE",
  //               "AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s"
  //             );
  //             return admin.database().ref("subscriptions").once("value");
  //           })
  //           .then(function (subscriptions) {
  //             subscriptions.forEach(function (sub) {
  //               var pushConfig = {
  //                 endpoint: sub.val().endpoint,
  //                 keys: {
  //                   auth: sub.val().keys.auth,
  //                   p256dh: sub.val().keys.p256dh,
  //                 },
  //               };

  //               webpush
  //                 .sendNotification(
  //                   pushConfig,
  //                   JSON.stringify({
  //                     title: "New Post",
  //                     content: "New Post added!",
  //                     openUrl: "/help",
  //                   })
  //                 )
  //                 .catch(function (err) {
  //                   console.log(err);
  //                 });
  //             });
  //             response
  //               .status(201)
  //               .json({ message: "Data stored", id: fields.id });
  //           })
  //           .catch(function (err) {
  //             response.status(500).json({ error: err });
  //           });
  //       } else {
  //         console.log(err);
  //       }
  //     }
  //   );
  // });

  // // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
  // // a callback when it's finished.
  // busboy.end(request.rawBody);
  // // formData.parse(request, function(err, fields, files) {
  // //   fs.rename(files.file.path, "/tmp/" + files.file.name);
  // //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
  // // });

const port = 5000 || process.env.PORT;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
