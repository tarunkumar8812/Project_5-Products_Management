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

    // if (userId !== req.decoded.userId) {
    //   return res.status(401).send({ status: false, message: "not auth" });
    // }

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

    let product = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product) {
      return res
        .status(404)
        .send({ status: false, message: "product not found" });
    }

    let price = product.price;

    let cartOfUser = await cartModel.findOne({ userId: userId });
    if (cartOfUser) {
      if (cartId) {
        let cart = await cartModel.findOne({ _id: cartId });
        if (!cart) {
          return res
            .status(404)
            .send({ status: false, message: "cart not found" });
        }
        let proIdsInCart = cart.items.map((x) => x.productId.toString());
        for (let i = 0; i <= proIdsInCart.length; i++) {
          if (proIdsInCart.includes(productId)) {
            cart.items[i].quantity += 1;
          } else {
            let items = {};
            items.productId = productId;
            items.quantity = 1;
            cart.items.push(items);
          }
        }
        let cartQuantity = cart.items.map((x) => x.quantity);
        cart.totalPrice += price;
        cart.totalItems = cartQuantity.reduce((acc, cur) => acc + cur, 0); //+1
        let updateData = cart.toObject();
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
      return res
        .status(400)
        .send({
          status: false,
          message:
            "there is already a cart is there for the give user, so required cartId in request body",
        });
    }

    let items = {};
    items.productId = productId;
    items.quantity = 1;

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

    let cart = await cartModel.findOne({ _id: data.cartId }).lean();
    if (!cart) {
      return res
        .status(404)
        .send({ status: false, message: "cart not not found" });
    }

    let carProductIds = cart.items.map((x) => x.productId.toString());
    if (!carProductIds.includes(productId)) {
      return res
        .status(404)
        .send({ status: false, message: "product not found in cart" });
    }
    let cartProducts = await productModel.find({
      _id: { $in: carProductIds },
    });
    let cartProductsPrices = cartProducts.map((x) => x.price);
    if (data.removeProduct === 1) {
      for (let i = 0; i < cart.items.length; i++) {
        if (data.productId === cart.items[i].productId.toString()) {
          cart.items[i].quantity -= 1;
          cart.totalPrice -= cartProductsPrices[i];
          cart.totalItems -= 1;
        }
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
    let items = cart.items.filter(
      (x) => x.productId.toString() !== data.productId
    );
    let proIds = carProductIds.filter((x) => x.toString() !== data.productId);
    let Products = await productModel.find({
      _id: { $in: proIds },
    });
    let ProductsPrices = Products.map((x) => x.price);
    let Quantity = items.map((x) => x.quantity);
    let finalPrices = [];
    for (let i = 0; i < ProductsPrices.length; i++) {
      finalPrices.push(ProductsPrices[i] * Quantity[i]);
    }
    let totalPrice = finalPrices.reduce((acc, cur) => acc + cur, 0);
    let totalQuantity = Quantity.reduce((acc, cur) => acc + cur, 0);
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

module.exports = { createCart, updateCart };
