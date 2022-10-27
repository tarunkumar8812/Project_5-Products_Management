const express = require("express");
const router = express.Router();

const { createUser, login, getUser, userUpdate, } = require("../controllers/userController");

const { createProduct, getProductByQuery, getProductByParam, updateProductByParam, deleteProduct, } = require("../controllers/productController");

const { createCart, updateCart, getCart, deleteCart, } = require("../controllers/cartController");

const { createOrder, updateOrder } = require("../controllers/orderController");

const { createReview } = require("../controllers/reviewController");

const { authentication, authorization } = require("../middleware/auth");

// -------------------------- User APIs --------------------------
router.post("/register", createUser);
router.post("/login", login);
router.get("/user/:userId/profile", authentication, authorization, getUser);
router.put("/user/:userId/profile", authentication, authorization, userUpdate);

// ------------------------ Product APIs ------------------------

router.post("/products", createProduct);
router.get("/products", getProductByQuery);
router.get("/products/:productId", getProductByParam);
router.put("/products/:productId", updateProductByParam);
router.delete("/products/:productId", deleteProduct);

// -------------------------- Cart APIs --------------------------

router.post("/users/:userId/cart", authentication, authorization, createCart);
router.put("/users/:userId/cart", authentication, authorization, updateCart);
router.get("/users/:userId/cart", authentication, authorization, getCart);
router.delete("/users/:userId/cart", authentication, authorization, deleteCart);

// ------------------------- Order APIs -------------------------

router.post("/users/:userId/orders", authentication, authorization, createOrder);
router.put("/users/:userId/orders", authentication, authorization, updateOrder);

// ------------------------- Order APIs -------------------------
router.post("/productReview/:userId", authentication, authorization, createReview);
module.exports = router;
