const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { isValidString } = require("../validations/validator");
const { V_userIdInParam, V_productIdInBody, V_cartIdInBody, V_removeProduct, validRest } = require("../validations/utils");





//-------------------------------------------create Cart API-------------------------------------------


async function createCart(req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;

    //checking atleast one data
    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });

    let errors = []

    let { cartId, productId, ...rest } = data;

    V_userIdInParam(userId, errors)

    V_productIdInBody(productId, errors)

    if (cartId) { V_cartIdInBody(cartId, errors) }

    validRest(rest, errors)

    if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });

    //------------checking product in DB------------
    let product = await productModel.findOne({ _id: productId.trim(), isDeleted: false, });

    if (!product) return res.status(404).send({ status: false, message: "product not found" });

    //-----------------Getting product price-----------------
    let price = product.price;

    //------------ checking cart is present for the given userID ------------ 
    let cart_in_DB = await cartModel.findOne({ userId });

    //---------- if cart not exist then creating a new one ---------
    if (!cart_in_DB) {

      if (cartId) {
        return res.status(403).send({ status: false, message: `This cardId ( ${cartId} ) does not belongs to you, to create new cart remove cardId from body`, });
      }
      //Adding necessary keys and values in in data for creating cart for first time
      data.userId = userId;
      data.items = { productId, quantity: 1 }
      data.totalPrice = price;
      data.totalItems = 1;

      let cartDoc = await cartModel.create(data);
      let Doc = cartDoc.toObject();
      Doc.items.forEach((x) => delete x._id);
      return res.status(201).send({ status: true, message: "Success", data: Doc, });
    }

    //---------- if cart exist then updating cart ---------

    if (cartId && cartId != cart_in_DB._id) {
      return res.status(403).send({ status: false, message: `This cardId ( ${cartId} ) does not belongs to you, to create new cart- use correct cartId or remove cardId from body`, });
    }

    let proIdsInCart = cart_in_DB.items.map((x) => x.productId.toString());

    for (let i = 0; i < proIdsInCart.length; i++) {
      if (proIdsInCart[i] === productId.trim()) {
        cart_in_DB.items[i].quantity += 1;
        break
      }
      if (i == proIdsInCart.length - 1) {
        cart_in_DB.items.push({ productId, quantity: 1 })
      }
    }

    //If the items lenght is 0, we have push the products without checking
    if (cart_in_DB.items.length === 0) {
      cart_in_DB.items.push({ productId, quantity: 1 })
    }

    //increasing totalPrice and totalItems
    cart_in_DB.totalPrice += price;
    cart_in_DB.totalItems = cart_in_DB.items.length;

    let upCart = await cartModel.findOneAndUpdate({ userId }, cart_in_DB, { new: true });

    let Doc = upCart.toObject();

    delete Doc._id;
    Doc.items.forEach((x) => delete x._id);

    return res.status(201).send({ status: true, message: "Success", data: Doc, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}


//-------------------------------------update Cart API-------------------------------------

async function updateCart(req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;

    //checking atleast one data
    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });

    let errors = []

    let { cartId, productId, removeProduct, ...rest } = data;

    V_userIdInParam(userId, errors)

    V_productIdInBody(productId, errors)

    V_cartIdInBody(cartId, errors)

    V_removeProduct(removeProduct, errors)

    validRest(rest, errors)

    if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });

    //-----------------checking cart in DB-----------------
    let cart = await cartModel.findOne({ _id: data.cartId.trim(), userId: userId }).lean();

    if (!cart) return res.status(404).send({ status: false, message: "cart not found with given userID and cartId combination", });


    //-----------------checking product in DB-----------------
    let product_in_DB = await productModel.findOne({ _id: productId, isDeleted: false })

    if (!product_in_DB) return res.status(404).send({ status: false, message: "product not found in DataBase", });

    //----Getting all the productIds in a cart to a variable as an array----
    let carProductIds = cart.items.map((x) => x.productId.toString());

    //-----checking the give productId is exists in cart or not----
    if (!carProductIds.includes(productId.trim())) return res.status(404).send({ status: false, message: "product not found in cart" })


    // ------------------ if removeProduct == 0 ------------------
    if (data.removeProduct === 0) {
      for (let i = 0; i < cart.items.length; i++) {
        if (data.productId.trim() === cart.items[i].productId.toString()) {
          cart.totalItems -= 1
          cart.totalPrice -= product_in_DB.price * cart.items[i].quantity
          cart.items.splice(i, 1)
        }
      }
      //----------------- updating cart ---------------
      let updatedCart = await cartModel.findOneAndUpdate({ userId }, { items: cart.items, totalPrice: cart.totalPrice, totalItems: cart.totalItems }, { new: true });

      return res.status(200).send({ status: true, message: "Success", data: updatedCart, });
    }



    // ------------------ if removeProduct == 1 ------------------
    for (let i = 0; i < cart.items.length; i++) {
      if (data.productId.trim() === cart.items[i].productId.toString()) {
        cart.items[i].quantity -= 1;
        cart.totalPrice -= product_in_DB.price;

        if (cart.items[i].quantity == 0) {
          cart.items.splice(i, 1)
          cart.totalItems -= 1
        }
      }
    }
    //----------------- updating cart ---------------
    let updatedCart = await cartModel.findOneAndUpdate({ userId }, { items: cart.items, totalPrice: cart.totalPrice, totalItems: cart.totalItems }, { new: true });

    return res.status(200).send({ status: true, message: "Success", data: updatedCart, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}




// ------------------------------------ get Cart API -------------------------------------

async function getCart(req, res) {
  try {
    let userId = req.params.userId;

    let user_in_DB = await userModel.findById(userId);

    if (!user_in_DB) return res.status(404).send({ status: false, message: "user not not found" });

    let cart_in_DB = await cartModel.findOne({ userId: userId }).select({ __v: 0 });

    if (!cart_in_DB) return res.status(404).send({ status: false, message: "cart not not found" });

    return res.status(200).send({ status: true, message: "Success", data: cart_in_DB, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// -------------------------------------- delete Cart API --------------------------------

async function deleteCart(req, res) {
  try {
    let userId = req.params.userId;

    let user_in_DB = await userModel.findById(userId);

    if (!user_in_DB) return res.status(404).send({ status: false, message: "user not not found" });

    let cart_in_DB = await cartModel.findOneAndUpdate({ userId }, { items: [], totalPrice: 0, totalItems: 0, }, { new: true });

    if (!cart_in_DB) return res.status(404).send({ status: false, message: "cart not found" });

    return res.status(204).send({ status: true, data: cart_in_DB, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createCart, updateCart, getCart, deleteCart };
