const express = require("express");
const {updateUserProfile, getUserProfile, getAllProfiles, getSignedinUserProfile } = require("../controllers/userController");
const { protectRoute } = require("../middlewares/protectRoute.js");
const router = express.Router();
// const authorize = require('../middlewares/roleCheckMiddleware.js');


router.get("/profile/get/allProfiles"/*, authorize(['admin'])*/, protectRoute, getAllProfiles);
router.get("/profile/get/SignedinUserProfile", protectRoute, /*authorize(['admin', `buyer`, `farmer`]),*/  getSignedinUserProfile);
router.get("/profile/get/:email", protectRoute, /*authorize(['admin']),*/ getUserProfile);
router.post("/profile/update", protectRoute, /*authorize(['admin', `buyer`, `farmer`]),*/ updateUserProfile);

module.exports = router;
