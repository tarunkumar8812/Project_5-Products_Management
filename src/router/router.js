const express = require("express");
const router = express.Router();
// const { login } = require("../controllers/userController/userLogin");
const { createUser, login } = require("../controllers/userController");

router.post("/register", createUser);
router.post("/login", login);

module.exports = router;
