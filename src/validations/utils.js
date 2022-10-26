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
const V_removeProduct = function (value, e) {
    if (value == undefined) { return }
    if (typeof value !== "number") { return e.push(`{ removeProduct must be number }`); }
    if (!(value == 0 || value == 1)) { return e.push(`{ removeProduct must be 0/1 }`); }
  }


// ------------- validation of Rest unexpected Fields -------------
const validRest = function (rest, e) {
    if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) data }`) }
}


module.exports = { V_productIdInParam, V_userIdInParam, V_productIdInBody, V_cartIdInBody,V_removeProduct,validRest }