const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId.isValid

const userId_in_Param = function (value, e) {
    if (value === ":userId") { return e.push(`{ userId required }`) }
    if (!ObjectId(value)) { return e.push(`{ invalid userId }`) }
}


module.exports = { userId_in_Param }