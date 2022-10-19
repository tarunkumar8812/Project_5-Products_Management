const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

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

    if (userId !== req.decoded.userId) {
      return res.status(401).send({ status: false, message: "not auth" });
    }

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please fill data in body" });
    }

    if (cartId) {
      if (!ObjectId.isValid(cartId)) {
        return res
          .status(400)
          .send({ status: false, message: "required valid cartId" });
      }
    }

    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid productId" });
    }

    //checking product in DB
    let product = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product) {
      return res
        .status(404)
        .send({ status: false, message: "product not found" });
    }

    //Getting product price
    let price = product.price;

    //checking cart is present for the given userID
    let cartOfUser = await cartModel.findOne({ userId: userId });
    if (cartOfUser) {
      if (cartId) {
        //checking cartId exist in cart collection are not
        let cart = await cartModel.findOne({ _id: cartId });
        if (!cart) {
          return res
            .status(404)
            .send({ status: false, message: "cart not found" });
        }

        //Getting all the productIds in a cart to a variable as an array
        let proIdsInCart = cart.items.map((x) => x.productId.toString());
        for (let i = 0; i <= proIdsInCart.length; i++) {
          if (proIdsInCart.includes(productId)) {
            //If productId is already present in cart, just increase the quantity
            cart.items[i].quantity += 1;
          } else {
            //else push the product to items
            let items = {};
            items.productId = productId;
            items.quantity = 1;
            cart.items.push(items);
          }
        }
        //Getting all the quantities products in a cart to a variable
        let cartQuantity = cart.items.map((x) => x.quantity);

        //increasing totalPrice and totalItems
        cart.totalPrice += price;
        cart.totalItems = cartQuantity.reduce((acc, cur) => acc + cur, 0); //+1
        let updateData = cart.toObject();
        //deleting unnecessary keys and there values in updateData
        delete updateData["_id"];
        delete updateData["userId"];
        let upCart = await cartModel.findOneAndUpdate(
          { userId: userId },
          updateData,
          { new: true }
        );
        return res.status(200).send({
          status: true,
          data: upCart,
        });
      }
      return res.status(400).send({
        status: false,
        message:
          "there is already a cart is there for the give user, so required cartId in request body",
      });
    }

    //Creating an empty object and adding the product for the first time
    let items = {};
    items.productId = productId;
    items.quantity = 1;

    //Adding necessary keys and values in in data for creating cart for first time
    data.userId = userId;
    data.items = items;
    data.totalPrice = price;
    data.totalItems = 1;

    let cartDoc = await cartModel.create(data);
    return res.status(201).send({
      status: true,
      data: cartDoc,
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

    if (userId !== req.decoded.userId) {
      return res.status(401).send({ status: false, message: "not auth" });
    }

    if (!ObjectId.isValid(cartId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid cartId" });
    }

    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "required valid productId" });
    }

    if (typeof removeProduct !== "number" || !/^[0-1]$/.test(removeProduct)) {
      return res
        .status(400)
        .send({ status: false, message: "removeProduct must be number(0/1)" });
    }

    //checking cart in DB
    let cart = await cartModel.findOne({ _id: data.cartId }).lean();
    if (!cart) {
      return res
        .status(404)
        .send({ status: false, message: "cart not not found" });
    }

    //Getting all the productIds in a cart to a variable as an array
    let carProductIds = cart.items.map((x) => x.productId.toString());
    //checking the give productId is exists in cart or not
    if (!carProductIds.includes(productId)) {
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
        if (data.productId === cart.items[i].productId.toString()) {
          cart.items[i].quantity -= 1;
          cart.totalPrice -= cartProductsPrices[i];
          cart.totalItems -= 1;
        }

        //While reducing the quantity, If quantity becomes 0 we have to remove the product from the items
        if (cart.items[i].quantity === 0) {
          let items = cart.items.filter(
            (x) => x.productId.toString() !== data.productId
          );
          let updatedCart = await cartModel.findOneAndUpdate(
            { _id: data.cartId },
            {
              items: items,
              totalPrice: cart.totalPrice,
              totalItems: cart.totalItems,
            },
            { new: true }
          );
          return res.status(200).send({
            status: true,
            data: updatedCart,
          });
        }
      }

      //updation of cart
      let updatedCart = await cartModel.findOneAndUpdate(
        { _id: data.cartId },
        {
          items: cart.items,
          totalPrice: cart.totalPrice,
          totalItems: cart.totalItems,
        },
        { new: true }
      );
      return res.status(200).send({
        status: true,
        data: updatedCart,
      });
    }

    //If removeProduct===0 we have to remove the product from the items

    //Getting the products which are not same as productId given in request
    let items = cart.items.filter(
      (x) => x.productId.toString() !== data.productId
    );
    //Getting the productIds which are not same as productId given in request
    let proIds = carProductIds.filter((x) => x.toString() !== data.productId);

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
    let totalQuantity = Quantity.reduce((acc, cur) => acc + cur, 0);

    //updating the cart
    let updatedCart = await cartModel.findOneAndUpdate(
      { _id: data.cartId },
      { items: items, totalPrice: totalPrice, totalItems: totalQuantity },
      { new: true }
    );
    return res.status(200).send({
      status: true,
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

    if (userId !== req.decoded.userId) {
      return res.status(401).send({ status: false, message: "not auth" });
    }

    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res
        .status(404)
        .send({ status: false, message: "user not not found" });
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

    if (userId !== req.decoded.userId) {
      return res.status(401).send({ status: false, message: "not auth" });
    }

    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res
        .status(404)
        .send({ status: false, message: "user not not found" });
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

    // ------- doubt 204 status code use case -----------
    return res.status(204).send({
      status: true,
      data: cart_in_DB,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createCart, updateCart, getCart, deleteCart };
