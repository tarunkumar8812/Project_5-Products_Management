const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId.isValid


const V_productIdInParam = function (productId, e) {
    if (productId == ":productId") { return e.push(` { productId required }`); }
    if (!ObjectId(productId)) { return e.push(` { Please Enter Valid productId }`); }

}
const V_userIdInParam = function (userId, e) {
    if (userId == ":userId") { return e.push(` { userId required }`); }
    if (!ObjectId(userId)) { return e.push(` { Please Enter Valid userId }`); }
}
const V_productIdInBody = function (productId, e) {
    if (productId == undefined) { return e.push(` { productId required }`); }
    if (typeof productId != "string") { return e.push(` { productId must be string }`); }
    if (productId.trim() == "") { return e.push(` { productId can not be empty }`); }
    if (!ObjectId(productId)) { return e.push(` { Please Enter Valid productId }`); }
}
const V_cartIdInBody = function (cartId, e) {
    if (cartId == undefined) { return e.push(` { cartId required }`); }
    if (typeof cartId != "string") { return e.push(` { cartId must be string }`); }
    if (cartId.trim() == "") { return e.push(` { cartId can not be empty }`); }
    if (!ObjectId(cartId)) { return e.push(` { Please Enter Valid cartId }`); }
}
const V_orderIdInBody = function (orderId, e) {
    if (orderId == undefined) { return e.push(` { orderId required }`); }
    if (typeof orderId != "string") { return e.push(` { orderId must be string }`); }
    if (orderId.trim() == "") { return e.push(` { orderId can not be empty }`); }
    if (!ObjectId(orderId)) { return e.push(` { Please Enter Valid orderId }`); }
}
const V_removeProduct = function (value, e) {
    if (value == undefined) { return }
    if (typeof value !== "number") { return e.push(`{ removeProduct must be number }`); }
    if (!(value == 0 || value == 1)) { return e.push(`{ removeProduct must be 0/1 }`); }
}

const V_cancellable = function (value, e) {
    if (value == undefined) { return }
    if (!(value == true || value == false)) { return e.push(`{ cancellable must be Boolean true/false }`); }
}

const V_statusForOrder = function (value, e) {
    if (value == undefined) { return e.push(`{ status is required and available status are:-( "pending", "completed", "cancelled") }`) }
    if (value.trim() == "") { return e.push(`{ status cannot be empty }`); }
    if (typeof value != "string") { return e.push(`{ status must be string format }`); }
    let arr = ["pending", "completed", "cancelled"];
    if (!arr.includes(value.trim())) { return e.push(`{ Invlid status- avlaible status are (${arr}) }`); }
  }


const V_likeStatus = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push(`{ likeStatus cannot be empty }`); }
    if (typeof value != "string") { return e.push(`{ likeStatus must be string format }`); }
    if (!(value.trim() == 'like' || value.trim() == "dislike")) { return e.push(`{ likeStatus must be like/dislike }`); }
}
const V_ratings = function (value, e) {
    if (value == undefined) { return }
    if (typeof value != "number") { return e.push(`{ ratings must be number format }`); }
    let regex = /^([1-5]){1,1}$/
    let validRegex = regex.test(value)
    if (validRegex == false) { return e.push(`{ ratings must be 1-5  }`) }
}

// ------------- validation of Rest unexpected Fields -------------
const validRest = function (rest, e) {
    if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) data }`) }
}


module.exports = { V_productIdInParam, V_userIdInParam, V_productIdInBody, V_cartIdInBody,V_orderIdInBody,V_statusForOrder, V_removeProduct, V_cancellable, V_likeStatus, V_ratings, validRest }