const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

async function createCart(req, res) {
  try {
    let data = req.body;
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

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please fill data in body" });
    }

    let productId = data.items.map((x) => x.productId);

    let inValidIds = productId.filter((x) => !ObjectId.isValid(x));
    // console.log(inValidIds);
    if (inValidIds.length > 0) {
      return res.status(400).send({
        status: false,
        message: `${inValidIds} these are invalid ObjectIds`,
      });
    }

    let quantity = data.items.map((x) => x.quantity);

    let inValidQuantity = quantity.filter(
      (x) => typeof x !== "number" || !/^[1-9]$/.test(x)
    );

    if (inValidQuantity.length > 0) {
      return res.status(400).send({
        status: false,
        message: `quantity must be number and greater than zero`,
      });
    }

    let product = await productModel.find({ _id: { $in: productId } });

    let prices = product.map((x) => x.price);

    let finalPrices = [];
    for (let i = 0; i < prices.length; i++) {
      finalPrices.push(prices[i] * quantity[i]);
    }

    let totalPrice = finalPrices.reduce((acc, cur) => acc + cur, 0);
    let totalQuantity = quantity.reduce((acc, cur) => acc + cur, 0);

    data.userId = userId;
    data.totalPrice = totalPrice;
    data.totalItems = totalQuantity;

    let cart = await cartModel.findOne({ userId: userId });
    if (cart) {
      let proIdsInCart = cart.items.map((x) => x.productId.toString());
      let oldProductsIds = productId.filter((x) => proIdsInCart.includes(x));
      for (let i = 0; i < data.items.length; i++) {
        if (oldProductsIds.includes(data.items[i].productId)) {
          cart.items[i].quantity += data.items[i].quantity;
        } else {
          cart.items.push(data.items[i]);
        }
      }
      let carProductIds = cart.items.map((x) => x.productId);
      let cartProducts = await productModel.find({
        _id: { $in: carProductIds },
      });
      let cartProductsPrices = cartProducts.map((x) => x.price);
      let cartQuantity = cart.items.map((x) => x.quantity);
      let cartFinalPrices = [];
      for (let i = 0; i < cartProductsPrices.length; i++) {
        cartFinalPrices.push(cartProductsPrices[i] * cartQuantity[i]);
      }
      cart.totalPrice = cartFinalPrices.reduce((acc, cur) => acc + cur, 0);
      cart.totalItems = cartQuantity.reduce((acc, cur) => acc + cur, 0);
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

    let cartDoc = await cartModel.create(data);
    return res.status(201).send({
      status: true,
      data: cartDoc,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createCart };
