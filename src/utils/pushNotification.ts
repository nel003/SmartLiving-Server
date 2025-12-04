import * as fs from "fs";
import * as path from "path";
import admin from "firebase-admin";
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "{}");

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

async function pushNotification(title: string, body: string, token: string) {
  console.log(serviceAccount)
    try {
        const message = {
            notification: {
              title,
              body,
            },
            token,
          };
          await admin.messaging().send(message);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

export default pushNotification;