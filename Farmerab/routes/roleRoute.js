const express = require("express");
const { seedRoles, getRole } = require("../controllers/roleController.js");
const router = express.Router();


router.get("/:id/role", getRole);

module.exports = router;