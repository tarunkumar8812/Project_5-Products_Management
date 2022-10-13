const express = require("express");
const router = express.Router();
// const { login } = require("../controllers/userController/userLogin");
const {
  createUser,
  login,
  getUser,
  userUpdate,
} = require("../controllers/userController");

const {
  createProduct,
  getProduct,
} = require("../controllers/productController");

const { authentication, authorization } = require("../middleware/auth");

router.post("/register", createUser);
router.post("/login", login);
router.get("/user/:userId/profile", authentication, getUser);
router.put("/user/:userId/profile", authentication, authorization, userUpdate);

router.post("/products", createProduct);
router.get("/products", getProduct);

module.exports = router;
