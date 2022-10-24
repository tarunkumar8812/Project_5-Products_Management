const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId.isValid


const V_productIdInParam = function (productId, e) {
    if (productId == ":productId") { return e.push(` { productId required }`); }

    if (!ObjectId(productId)) { return e.push(` { Please Enter Valid productId }`); }

}

// ------------- validation of Rest unexpected Fields -------------
const validRest = function (rest, e) {
    if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) data }`) }
}


module.exports = { V_productIdInParam, validRest }