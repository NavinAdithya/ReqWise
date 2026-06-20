"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/qa-performance', auth_1.protect, (0, auth_1.restrictTo)('ADMIN'), UserController_1.UserController.getQAPerformance);
exports.default = router;
