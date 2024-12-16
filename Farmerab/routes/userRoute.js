const express = require("express");
const {updateUserProfile, getUserProfile, getAllProfiles, getSignedinUserProfile } = require("../controllers/userController");
const { protectRoute } = require("../middlewares/protectRoute.js");
const router = express.Router();
const authorize = require('../middlewares/roleCheckMiddleware.js');


router.get("/profile/allProfiles", authorize(['admin']), getAllProfiles);
router.get("/profile/getSignedinUserProfile", protectRoute, authorize(['admin', `buyer`, `farmer`]), protectRoute, getSignedinUserProfile);
router.get("/profile/:email", protectRoute, authorize(['admin']), getUserProfile);
router.post("/profile/update", protectRoute, authorize(['admin', `buyer`, `farmer`]), updateUserProfile);

module.exports = router;
