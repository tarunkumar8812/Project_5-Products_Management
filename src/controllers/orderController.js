const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

async function createOrder(req, res) {
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

        // if (userId !== req.decoded.userId) {
        //     return res.status(401).send({ status: false, message: "not auth" });
        // }



        // ------------ checking user in DB -------------
        let user_in_DB = await userModel.findById(userId)
        if (!user_in_DB) {
            return res
                .status(404)
                .send({ status: false, message: "user not found" });
        }


        // ------------ checking cart in DB -------------
        let cart_in_DB = await cartModel.findOne({ userId: userId }).lean()
        if (!cart_in_DB) {
            return res
                .status(404)
                .send({ status: false, message: "cart not found" });
        }

        // console.log(cart_in_DB)

        let totalQuantity = 0
        cart_in_DB.items.forEach(x => totalQuantity += x.quantity)
        // console.log(totalQuantity)
        cart_in_DB["totalQuantity"] = totalQuantity
        console.log(cart_in_DB)
        //Getting product price
        // let price = product.price;

        // //checking cart is present for the given userID
        // let cartOfUser = await cartModel.findOne({ userId: userId });
        // if (cartOfUser) {
        //     if (cartId) {
        //         //checking cartId exist in cart collection are not
        //         let cart = await cartModel.findOne({ _id: cartId });
        //         if (!cart) {
        //             return res
        //                 .status(404)
        //                 .send({ status: false, message: "cart not found" });
        //         }

        //         //Getting all the productIds in a cart to a variable as an array
        //         let proIdsInCart = cart.items.map((x) => x.productId.toString());
        //         for (let i = 0; i <= proIdsInCart.length; i++) {
        //             if (proIdsInCart.includes(productId)) {
        //                 //If productId is already present in cart, just increase the quantity
        //                 cart.items[i].quantity += 1;
        //             } else {
        //                 //else push the product to items
        //                 let items = {};
        //                 items.productId = productId;
        //                 items.quantity = 1;
        //                 cart.items.push(items);
        //             }
        //         }
        //         //Getting all the quantities products in a cart to a variable
        //         let cartQuantity = cart.items.map((x) => x.quantity);

        //         //increasing totalPrice and totalItems
        //         cart.totalPrice += price;
        //         cart.totalItems = cartQuantity.reduce((acc, cur) => acc + cur, 0); //+1
        //         let updateData = cart.toObject();
        //         //deleting unnecessary keys and there values in updateData
        //         delete updateData["_id"];
        //         delete updateData["userId"];
        //         let upCart = await cartModel.findOneAndUpdate(
        //             { userId: userId },
        //             updateData,
        //             { new: true }
        //         );
        //         return res.status(200).send({
        //             status: true,
        //             data: upCart,
        //         });
        //     }
        //     return res.status(400).send({
        //         status: false,
        //         message:
        //             "there is already a cart is there for the give user, so required cartId in request body",
        //     });
        // }

        // //Creating an empty object and adding the product for the first time
        // let items = {};
        // items.productId = productId;
        // items.quantity = 1;

        // //Adding necessary keys and values in in data for creating cart for first time
        // data.userId = userId;
        // data.items = items;
        // data.totalPrice = price;
        // data.totalItems = 1;

        let orderDetails = await orderModel.create(cart_in_DB);
        return res.status(201).send({
            status: true,
            data: orderDetails,
        }); s


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

//   -------------- update order API -----------



async function updateOrder(req, res) {
    try {
        // let data = req.body;
        // let userId = req.params.userId;

        // let { cartId, productId, ...rest } = data;

        // if (Object.keys(rest).length > 0) {
        //     return res.status(400).send({
        //         status: false,
        //         message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
        //     });
        // }

        // if (userId === ":userId") {
        //     return res
        //         .status(400)
        //         .send({ status: false, message: "userId required" });
        // }

        // if (!ObjectId.isValid(userId)) {
        //     return res
        //         .status(400)
        //         .send({ status: false, message: "required valid userId" });
        // }

        // if (userId !== req.decoded.userId) {
        //     return res.status(401).send({ status: false, message: "not auth" });
        // }

        // if (Object.keys(data).length == 0) {
        //     return res
        //         .status(400)
        //         .send({ status: false, message: "Please fill data in body" });
        // }


        // let cartDoc = await cartModel.create(data);
        // return res.status(201).send({
        //     status: true,
        //     data: cartDoc,
        // });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}
module.exports = { createOrder, updateOrder } 