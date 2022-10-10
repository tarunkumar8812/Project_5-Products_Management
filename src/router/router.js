const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");

router.post("/register", controller.createUser);

module.exports = router;
