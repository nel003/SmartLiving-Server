const admin = require("firebase-admin");
const serviceAccount = require("./smart-living-b4e4e-15aae37ffbdb.json"); // path to your JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const message = {
  notification: {
    title: "Pussy",
    body: "Wow wow wow, this is a test notification",
  },
  token: "cL6lWX5RQpOfzcYwJKtV_R:APA91bEyZXFlEu9-TJkvs2y1MSx8zOoVGuOcxXpUhdMukPFwMHsb_cCJP_5FsZH-XxoKyR5gqdvjF076OMgjqwBe-30KfK8ACC0yroDj-E6o_EPSgcVItAQ",
};

admin.messaging().send(message)
  .then((response) => {
    console.log("✅ Message sent:", response);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
  });
