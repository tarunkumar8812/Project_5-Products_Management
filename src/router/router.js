const express = require("express");
const router = express.Router();
// const { login } = require("../controllers/userController/userLogin");
const { createUser, login, getUser } = require("../controllers/userController");
const { authentication } = require("../middleware/auth")

router.post("/register", createUser);
router.post("/login", login);
router.get("/user/:userId/profile", authentication, getUser)

module.exports = router;
