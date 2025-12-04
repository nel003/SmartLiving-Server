"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateUser_1 = require("../middleware/validateUser");
const rooms_1 = require("../api/rooms");
const router = (0, express_1.Router)();
//Device routes
router.get('/', validateUser_1.validateUser, rooms_1.rooms.get);
exports.default = router;
