"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "{}");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
const message = {
    notification: {
        title: "Pussy",
        body: "Wow wow wow, this is a test notification",
    },
    token: "cL6lWX5RQpOfzcYwJKtV_R:APA91bEyZXFlEu9-TJkvs2y1MSx8zOoVGuOcxXpUhdMukPFwMHsb_cCJP_5FsZH-XxoKyR5gqdvjF076OMgjqwBe-30KfK8ACC0yroDj-E6o_EPSgcVItAQ",
};
async function pushNotification(title, body, token) {
    try {
        const message = {
            notification: {
                title,
                body,
            },
            token,
        };
        await firebase_admin_1.default.messaging().send(message);
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
}
exports.default = pushNotification;
