const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  getUser,
  userUpdate,
} = require("../controllers/userController");

const {
  createProduct,
  getProduct,
  getProductByParam,
  updateProductByParam,
  deleteProduct,
} = require("../controllers/productController");

const {
  createCart,
  updateCart,
  getCart,
  deleteCart,
} = require("../controllers/cartController");

const { createOrder, updateOrder } = require("../controllers/orderController");

const { authentication, authorization } = require("../middleware/auth");

// -------------------------- User APIs --------------------------
router.post("/register", createUser);
router.post("/login", login);
router.get("/user/:userId/profile", authentication, getUser);
router.put("/user/:userId/profile", authentication, authorization, userUpdate);

// ------------------------ Product APIs ------------------------

router.post("/products", createProduct);
router.get("/products", getProduct);
router.get("/products/:productId", getProductByParam);
router.put("/products/:productId", updateProductByParam);
router.delete("/products/:productId", deleteProduct);

// -------------------------- Cart APIs --------------------------

router.post("/users/:userId/cart", authentication, createCart);
router.put("/users/:userId/cart", authentication, updateCart);
router.get("/users/:userId/cart", authentication, getCart);
router.delete("/users/:userId/cart", authentication, deleteCart);

// ------------------------- Order APIs -------------------------

router.post(
  "/users/:userId/orders",
  authentication,
  authorization,
  createOrder
);
router.put("/users/:userId/orders", authentication, authorization, updateOrder);

module.exports = router;
