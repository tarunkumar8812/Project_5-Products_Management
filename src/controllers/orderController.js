const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const { V_userIdInParam, V_cartIdInBody, V_orderIdInBody, V_statusForOrder, V_cancellable, validRest } = require("../validations/utils");



//   ---------------------------------- create order API -------------------------------

async function createOrder(req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    let { cartId, cancellable, ...rest } = data;


    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });

    let errors = []

    V_userIdInParam(userId, errors)

    V_cartIdInBody(cartId, errors)

    V_cancellable(cancellable, errors)

    validRest(rest, errors)

    if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });

    // ------------ checking cart in DB -------------
    let cart_in_DB = await cartModel.findOne({ userId: userId }).lean();

    if (!cart_in_DB) return res.status(404).send({ status: false, message: "cart not found" });


    // ------------ calculating the total quantity  -------------
    let totalQuantity = 0;
    cart_in_DB.items.forEach((x) => (totalQuantity += x.quantity));
    cart_in_DB["totalQuantity"] = totalQuantity;

    if (cancellable === true || cancellable === false) {
      cart_in_DB["cancellable"] = cancellable;
    }

    // ------------ checking order of user in DB -------------
    let order_of_user = await orderModel.findOne({ userId: userId })


    // ----- if order of user exits -----
    if (order_of_user) {
      if (cart_in_DB["totalItems"] === 0) {
        return res.status(400).send({ status: false, message: "required items in cart to place the order", });
      }

      let updateOrder = await orderModel.findOneAndUpdate({ userId: userId }, cart_in_DB, { new: true });

      await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 });

      return res.status(200).send({ status: true, message: "Success", data: updateOrder, });
    }


    // ----- if order of user not exits -----
    let orderDetails = await orderModel.create(cart_in_DB);

    await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 });

    return res.status(201).send({ status: true, message: "Success", data: orderDetails, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}



//   ---------------------------------- update order API -------------------------------

async function updateOrder(req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;

    let { status, orderId, ...rest } = data;

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });

    let errors = []

    V_userIdInParam(userId, errors)

    V_orderIdInBody(orderId, errors)

    V_statusForOrder(status, errors)

    validRest(rest, errors)

    if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });


    // ------------ checking order in DB -------------
    let order_of_user = await orderModel.findOne({ userId: userId });

    if (!order_of_user) return res.status(400).send({ status: false, message: "there is no order for given userId", });


    // ------------ checking order status in DB -------------
    if (order_of_user.status != "pending") {
      // if (order_of_user.status === "completed" || order_of_user.status === "cancelled") {

      return res.status(400).send({ status: false, message: `the order is already ${order_of_user.status}`, });
    }

    // ------------ checking order is cancelable or not  -------------
    if (status === "cancelled") {
      if (order_of_user.cancellable === false) {
        // if not cancelable
        return res.status(400).send({ status: false, message: "these order is not cancellable", });
      }

      // if  cancelable    then canelling the order
      let updatedOrder = await orderModel.findOneAndUpdate({ userId: userId }, { status: "cancelled" }, { new: true });

      return res.status(200).send({ status: true, message: "Success", data: updatedOrder, });

    }

    // ------------ if user is sending status == completed  -------------
    let updatedOrder = await orderModel.findOneAndUpdate({ userId: userId }, { status: status }, { new: true });

    return res.status(200).send({ status: true, message: "Success", data: updatedOrder, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createOrder, updateOrder };
