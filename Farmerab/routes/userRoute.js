const express = require("express");
const {updateUserProfile, getUserProfile, getAllProfiles, getSignedinUserProfile } = require("../controllers/userController");
const { protectRoute } = require("../middlewares/protectRoute.js");
const router = express.Router();


router.get("/profile/allProfiles", getAllProfiles);
router.get("/profile/getSignedinUserProfile", protectRoute, getSignedinUserProfile);
router.get("/profile/:email", getUserProfile);
router.post("/profile/update", protectRoute, updateUserProfile);

module.exports = router;
