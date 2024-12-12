const express = require("express");
const {updateUserProfile, getUserProfile, getAllUsersProfile, getSignedinUserProfile } = require("../controllers/userController");
const { protectRoute } = require("../middlewares/protectRoute.js");
const router = express.Router();


router.get("/profiles/allProfiles", getAllUsersProfile);
router.get("/profile/getSignedinUserProfile", protectRoute, getSignedinUserProfile);
router.get("/profile/:email", getUserProfile);
router.post("/profile/update", protectRoute, updateUserProfile);

module.exports = router;
