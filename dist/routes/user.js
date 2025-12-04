"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signup_1 = require("../api/user/signup");
const login_1 = require("../api/user/login");
const logout_1 = require("../api/user/logout");
const validateUser_1 = require("../middleware/validateUser");
const refresh_1 = require("../api/user/refresh");
const validateRefreshToken_1 = require("../middleware/validateRefreshToken");
const key_1 = __importDefault(require("../api/user/key"));
const pushToken_1 = require("../api/user/pushToken");
const profile_1 = __importDefault(require("../api/user/profile"));
const validation_1 = require("../utils/validation");
const upload_1 = require("../utils/upload");
const router = (0, express_1.Router)();
//User routes with validation
router.post('/signup', (0, validation_1.validate)(validation_1.validationSchemas.signup), signup_1.signup);
router.post('/login', (0, validation_1.validate)(validation_1.validationSchemas.login), login_1.login);
router.delete('/logout', validateUser_1.validateUser, logout_1.logout);
router.get('/refresh', validateRefreshToken_1.validateRefreshToken, refresh_1.refresh);
router.get('/key', validateUser_1.validateUser, key_1.default.getKey);
// router.post('/key', validateUser, homeKey.createKey);
// Profile routes
router.get('/profile', validateUser_1.validateUser, profile_1.default.get);
router.put('/profile', validateUser_1.validateUser, (0, validation_1.validate)(validation_1.validationSchemas.updateProfile), profile_1.default.update);
router.post('/profile/photo', validateUser_1.validateUser, upload_1.uploadProfilePhoto.single('photo'), profile_1.default.uploadPhoto);
router.delete('/profile/photo', validateUser_1.validateUser, profile_1.default.deletePhoto);
// Push notification token routes
router.post('/push-token', validateUser_1.validateUser, (0, validation_1.validate)(validation_1.validationSchemas.pushToken), pushToken_1.pushToken.upsertToken);
router.get('/push-tokens', validateUser_1.validateUser, pushToken_1.pushToken.getUserTokens);
router.delete('/push-token/:tokenId', validateUser_1.validateUser, pushToken_1.pushToken.deleteToken);
router.delete('/push-token', validateUser_1.validateUser, pushToken_1.pushToken.deleteTokenByValue);
exports.default = router;
