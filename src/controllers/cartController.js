const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { isValidString } = require("../validations/validator");

async function createCart(req, res) {
  try {
    let data = req.body;
    let userId = req.params.userId;

    let { cartId, productId, ...rest } = data;

    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
      });
    }

    if (userId === ":userId") {
      return res
        .status(400)
        .send({ status: false, message: "userId required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid userId" });
    }

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please fill data in body" });
    }

    if (cartId) {
      if (!isValidString(cartId)) {
        return res.status(400).send({
          status: false,
          message: "the value of cartId must be string",
        });
      }
      if (!ObjectId.isValid(cartId.trim())) {
        return res
          .status(400)
          .send({ status: false, message: "required valid cartId" });
      }
    }

    if (!isValidString(productId)) {
      return res.status(400).send({
        status: false,
        message: "the value of productId must be string",
      });
    }
    if (!ObjectId.isValid(productId.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "required valid productId" });
    }

    // ------------ checking user in DB -------------
    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res.status(404).send({ status: false, message: "user not found" });
    }

    //checking product in DB
    let product = await productModel.findOne({
      _id: productId.trim(),
      isDeleted: false,
    });
    if (!product) {
      return res
        .status(404)
        .send({ status: false, message: "product not found" });
    }

    if (userId !== req.decoded.userId) {
      return res.status(401).send({ status: false, message: "not auth" });
    }

    //Getting product price
    let price = product.price;

    //checking cart is present for the given userID
    let cartOfUser = await cartModel.findOne({ userId: userId });
    if (cartOfUser) {
      if (cartId) {
        //checking cartId exist in cart collection are not
        let cart = await cartModel.findOne({
          _id: cartId.trim(),
          userId: userId,
        });
        if (!cart) {
          return res.status(404).send({
            status: false,
            message: `cart not found with given userID and cartId combination, In place of cartId value use these cartId:-${cartOfUser._id}`,
          });
        }

        //Getting all the productIds in a cart to a variable as an array
        let proIdsInCart = cart.items.map((x) => x.productId.toString());
        for (let i = 0; i < proIdsInCart.length; i++) {
          if (proIdsInCart[i] === productId.trim()) {
            //If productId is already present in cart, just increase the quantity
            cart.items[i].quantity += 1;
          }
        }
        if (!proIdsInCart.includes(productId.trim())) {
          let items = {};
          items.productId = productId.trim();
          items.quantity = 1;
          cart.items.push(items);
        }
        //If the items lenght is 0, we have push the products with out checking
        if (cart.items.length === 0) {
          let items = {};
          items.productId = productId.trim();
          items.quantity = 1;
          cart.items.push(items);
        }

        //increasing totalPrice and totalItems
        cart.totalPrice += price;
        cart.totalItems = cart.items.length;
        let updateData = cart.toObject();
        //deleting unnecessary keys and there values in updateData
        delete updateData["_id"];
        delete updateData["userId"];
        let upCart = await cartModel.findOneAndUpdate(
          { _id: cartId.trim(), userId: userId },
          updateData,
          { new: true }
        );
        let Doc = upCart.toObject();
        Doc.items.forEach((x) => delete x._id);
        return res.status(201).send({
          status: true,
          message: "Success",
          data: Doc,
        });
      }
      return res.status(400).send({
        status: false,
        message: `there is already a cart is there for the give user, so required cartId(${cartOfUser._id}) in request body`,
      });
    }

    //Creating an empty object and adding the product for the first time
    let items = {};
    items.productId = productId.trim();
    items.quantity = 1;

    //Adding necessary keys and values in in data for creating cart for first time
    data.userId = userId;
    data.items = items;
    data.totalPrice = price;
    data.totalItems = 1;

    let cartDoc = await cartModel.create(data);
    let Doc = cartDoc.toObject();
    Doc.items.forEach((x) => delete x._id);
    return res.status(201).send({
      status: true,
      message: "Success",
      data: Doc,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

//====================updateCart========================//
async function updateCart(req, res) {
  try {
    let data = req.body;
    let userId = req.params.userId;

    let { cartId, productId, removeProduct, ...rest } = data;
    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
      });
    }

    if (userId === ":userId") {
      return res
        .status(400)
        .send({ status: false, message: "userId required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid userId" });
    }

    if (!isValidString(cartId)) {
      return res
        .status(400)
        .send({ status: false, message: "the value of cartId must be string" });
    }
    if (!ObjectId.isValid(cartId.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "required valid cartId" });
    }

    if (!isValidString(productId)) {
      return res.status(400).send({
        status: false,
        message: "the value of productId must be string",
      });
    }
    if (!ObjectId.isValid(productId.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "required valid productId" });
    }

    if (typeof removeProduct !== "number" || !/^[0-1]$/.test(removeProduct)) {
      return res
        .status(400)
        .send({ status: false, message: "removeProduct must be number(0/1)" });
    }

    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res.status(404).send({ status: false, message: "user not found" });
    }

    if (userId !== req.decoded.userId) {
      return res.status(403).send({ status: false, message: "not auth" });
    }

    //checking cart in DB
    let cart = await cartModel
      .findOne({ _id: data.cartId.trim(), userId: userId })
      .lean();
    if (!cart) {
      return res
        .status(404)
        .send({
          status: false,
          message: "cart not found with given userID and cartId combination",
        });
    }

    //Getting all the productIds in a cart to a variable as an array
    let carProductIds = cart.items.map((x) => x.productId.toString());
    //checking the give productId is exists in cart or not
    if (!carProductIds.includes(productId.trim())) {
      return res
        .status(404)
        .send({ status: false, message: "product not found in cart" });
    }

    //Making a DB call to get all the products in a variable as a array of objects
    let cartProducts = await productModel.find({
      _id: { $in: carProductIds },
    });

    //Getting all the product prices in cart as an array in variable
    let cartProductsPrices = cartProducts.map((x) => x.price);

    //If removeProduct===1 we have to reduce the particular quantity of product and  totalPrice,totalItems
    if (data.removeProduct === 1) {
      for (let i = 0; i < cart.items.length; i++) {
        if (data.productId.trim() === cart.items[i].productId.toString()) {
          cart.items[i].quantity -= 1;
          cart.totalPrice -= cartProductsPrices[i];
        }

        //While reducing the quantity, If quantity becomes 0 we have to remove the product from the items
        if (cart.items[i].quantity === 0) {
          let items = cart.items.filter(
            (x) => x.productId.toString() !== data.productId.trim()
          );
          let updatedCart = await cartModel.findOneAndUpdate(
            { _id: data.cartId.trim(), userId: userId },
            {
              items: items,
              totalPrice: cart.totalPrice,
              totalItems: items.length,
            },
            { new: true }
          );
          return res.status(200).send({
            status: true,
            message: "Success",
            data: updatedCart,
          });
        }
      }

      //updation of cart
      let updatedCart = await cartModel.findOneAndUpdate(
        { _id: data.cartId.trim(), userId: userId },
        {
          items: cart.items,
          totalPrice: cart.totalPrice,
          // totalItems: cart.totalItems,
        },
        { new: true }
      );
      return res.status(200).send({
        status: true,
        message: "Success",
        data: updatedCart,
      });
    }  

    //If removeProduct===0 we have to remove the product from the items

    //Getting the products which are not same as productId given in request
    let items = cart.items.filter(
      (x) => x.productId.toString() !== data.productId.trim()
    );
    //Getting the productIds which are not same as productId given in request
    let proIds = carProductIds.filter(
      (x) => x.toString() !== data.productId.trim()
    );

    //Making a DB call to get all the products in a variable as a array of objects
    let Products = await productModel.find({
      _id: { $in: proIds },
    });

    //Getting the prices and quantities of all the products
    let ProductsPrices = Products.map((x) => x.price);
    let Quantity = items.map((x) => x.quantity);
    let finalPrices = [];
    for (let i = 0; i < ProductsPrices.length; i++) {
      finalPrices.push(ProductsPrices[i] * Quantity[i]);
    }

    //Getting totalPrice and totalQuantity
    let totalPrice = finalPrices.reduce((acc, cur) => acc + cur, 0);
    let totalItems = items.length;

    //updating the cart
    let updatedCart = await cartModel.findOneAndUpdate(
      { _id: data.cartId.trim(), userId: userId },
      { items: items, totalPrice: totalPrice, totalItems: totalItems },
      { new: true }
    );
    return res.status(200).send({
      status: true,
      message: "Success",
      data: updatedCart,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// --------------- get Cart ---------------------------

async function getCart(req, res) {
  try {
    let userId = req.params.userId;

    if (userId === ":userId") {
      return res
        .status(400)
        .send({ status: false, message: "userId required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid userId" });
    }

    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res
        .status(404)
        .send({ status: false, message: "user not not found" });
    }

    if (userId !== req.decoded.userId) {
      return res.status(403).send({ status: false, message: "not auth" });
    }

    let cart_in_DB = await cartModel
      .findOne({ userId: userId })
      .select({ __v: 0 });
    if (!cart_in_DB) {
      return res
        .status(404)
        .send({ status: false, message: "cart not not found" });
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      data: cart_in_DB,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// ----------- delete Cart API ----------------

async function deleteCart(req, res) {
  try {
    let userId = req.params.userId;

    if (userId === ":userId") {
      return res
        .status(400)
        .send({ status: false, message: "userId required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid userId" });
    }

    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res
        .status(404)
        .send({ status: false, message: "user not not found" });
    }

    if (userId !== req.decoded.userId) {
      return res.status(403).send({ status: false, message: "not auth" });
    }

    let cart_in_DB = await cartModel.findOneAndUpdate(
      { userId: userId },
      {
        items: [],
        totalPrice: 0,
        totalItems: 0,
      },
      { new: true }
    );

    if (!cart_in_DB) {
      return res.status(404).send({ status: false, message: "cart not found" });
    }

    return res.status(204).send({
      status: true,
      data: cart_in_DB,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createCart, updateCart, getCart, deleteCart };
