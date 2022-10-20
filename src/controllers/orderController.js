const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

async function createOrder(req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    let { cancellable, ...rest } = data;

    // if (Object.keys(rest).length > 0) {
    //   return res.status(400).send({
    //     status: false,
    //     message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
    //   });
    // }

    if (data.hasOwnProperty("cancellable")) {
      if (typeof cancellable !== "boolean") {
        return res.status(400).send({
          status: false,
          message: "value of cancellable must be Boolean",
        });
      }
    }


    // ------------ checking cart in DB -------------
    let cart_in_DB = await cartModel.findOne({ userId: userId }).lean();
    if (!cart_in_DB) {
      return res.status(404).send({ status: false, message: "cart not found" });
    }

    let totalQuantity = 0;
    cart_in_DB.items.forEach((x) => (totalQuantity += x.quantity));
    cart_in_DB["totalQuantity"] = totalQuantity;
    if (cancellable === true || cancellable === false) {
      cart_in_DB["cancellable"] = cancellable;
    }

    let order_of_user = await orderModel.findOne({ userId: userId });
    if (order_of_user) {
      if (cart_in_DB["totalItems"] === 0) {
        return res.status(400).send({
          status: false,
          message: "required items in cart to place the order",
        });
      }
      let updateOrder = await orderModel.findOneAndUpdate(
        { userId: userId },
        cart_in_DB,
        { new: true }
      );
      await cartModel.findOneAndUpdate(
        { userId: userId },
        { items: [], totalPrice: 0, totalItems: 0 }
      );
      return res.status(200).send({
        status: true,
        message: "Success",
        data: updateOrder,
      });
    }

    let orderDetails = await orderModel.create(cart_in_DB);
    await cartModel.findOneAndUpdate(
      { userId: userId },
      { items: [], totalPrice: 0, totalItems: 0 }
    );
    return res.status(201).send({
      status: true,
      message: "Success",
      data: orderDetails,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

//   -------------- update order API -----------

async function updateOrder(req, res) {
  try {
    let data = req.body;
    let userId = req.params.userId;

    let { status, ...rest } = data;

    // if (Object.keys(rest).length > 0) {
    //   return res.status(400).send({
    //     status: false,
    //     message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
    //   });
    // }

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please fill data in body" });
    }

    let arr = ["pending", "completed", "cancelled"];
    if (!arr.includes(status.trim())) {
      return res.status(400).send({
        status: false,
        message: `the value status must be amoung these ${arr.join(", ")}`,
      });
    }

    // ------------ checking user in DB -------------
    let user_in_DB = await userModel.findById(userId);
    if (!user_in_DB) {
      return res.status(404).send({ status: false, message: "user not found" });
    }

    let order_of_user = await orderModel.findOne({ userId: userId });
    if (!order_of_user) {
      return res.status(400).send({
        status: false,
        message: "there is no order for given userId",
      });
    }

    if(order_of_user.status==="completed"||order_of_user.status==="cancelled"){
      return res.status(400).send({
        status: false,
        message: `the order is already ${order_of_user.status}`,
      });
    }
    if (status === "cancelled") {
      if (order_of_user.cancellable === true) {
        let updatedOrder = await orderModel.findOneAndUpdate(
          { userId: userId },
          { status: "cancelled" },
          { new: true }
        );
        return res.status(200).send({
          status: true,
          message: "Success",
          data: updatedOrder,
        });
      }
      return res.status(400).send({
        status: false,
        message: "these order is not cancellable",
      });
    }
    let updatedOrder = await orderModel.findOneAndUpdate(
      { userId: userId },
      { status: status },
      { new: true }
    );
    return res.status(200).send({
      status: true,
      message: "Success",
      data: updatedOrder,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}
module.exports = { createOrder, updateOrder };
