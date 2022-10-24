const { uploadFile } = require("../AWS/aws");



// ------------- validation of Product Title -------------

const validTitle = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.unshift("{ Title can not be empty }") }
    // let regex = /^([a-zA-Z]){2,15}$/
    // let validRegex = regex.test(value.trim())
    // if (validRegex == false) { return e.push(`{ Invalid Title:- available characters are ( a-zA-Z ) with minimum 2 and maximum 15 characters. }`) }
    return true

}
// ------------- validation of Product Description-------------

const validDescription = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Description can not be empty }") }
    // let regex = /^([a-zA-Z]){10,100}$/
    // let validRegex = regex.test(value.trim())
    // if (validRegex == false) { return e.push(`{ Invalid Description:- available characters are ( a-zA-Z ) with minimum 10 and maximum 100 characters }`) }
    return true
}

// ------------- validation of Product Price -------------
const validPrice = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Price can not be empty }") }

    let regex = /^(0|[1-9]\d*)(\.\d+)?$/;
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push(`{ Invalid Price format ( ex:- 250/299.50 )}`) }
    return true
}


// ------------- validation of Product Currency Id -------------

const validCurrencyId = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ CurrencyId can not be empty }") }
    if (value.trim() !== "INR") { return e.push(`{ CurrencyId must be INR }`) }
}



// ------------- validation of Product Currency Format -------------

const validCurrencyFormat = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ CurrencyFormat can not be empty }") }
    if (value.trim() !== "₹") { return e.push(`{ CurrencyFormat must be ₹ }`) }
}



// ------------- validation of Product isFreeShipping Format -------------

const validIsFreeShipping = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{  isFreeShipping  can not be empty }") }
    if (value.trim() == "true") { return value = true }
    if (value.trim() == "false") { return value = false }
    else { return e.push(`{  isFreeShipping  must be true/false }`) }
}

// ------------- validation of Product Style Format -------------

const validStyle = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Style can not be empty }") }
    let regex = /^([a-zA-Z .,/]){2,100}$/
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push(`{ Invalid Style:- available characters are ( a-zA-Z .,/) with minimum 10 and maximum 100 characters }`) }
    return true
}

// ------------- validation of Product AvailableSizes -------------

const validAvailableSizes = function (value, e) {
    if (value == undefined) { return }
    if (value == "") { return e.push("{ AvailableSizes can not be empty }") }
    value = value.split(",").map((x) => x.trim().toUpperCase());

    let sizeList = ["XS", "S", "M", "X", "L", "XL", "XXL"]
    let arr = []
    for (field of value) {
        if (!sizeList.includes(field)) { arr.push(field) }
    }
    if (arr.length > 0) { return e.push(`{ ${arr} is/are Invalid sizes, available sizes are ( ${sizeList} ) }`) }

    return value
}


// ------------- validation of Product Installments -------------


const validInstallments = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Installments can not be empty }") }

    let regex = /^[0-9]{0,2}$/
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push(`{ installments must in digits ( 0-9 ) }`) }

}



// ------------- validation of Product ProductImage -------------


const validProductImage = function (value, e) {
    if (value.length == 0) { return }
    if (!(value[0].mimetype == "image/png" || value[0].mimetype == "image/jpg" || value[0].mimetype == "image/jpeg")) {
        return e.push(`{ Only .png, .jpg and .jpeg format allowed ! }`)
    }
    if (value[0].size > 2000000) { return e.push(`{ maximum size of image can be 2 MB }`) }
    return true

}


const validRest = function (rest, e) {
    if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) data }`) }
}


const validName = function (value, e) {
    if (value.trim() == "") { return e.push("{ title can not be empty }") }

    return { $regex: `${value}` };
}

const validSize = function (value, e) {
    if (value.trim() == "") { return e.push("{ AvailableSizes can not be empty }") }
    let sizeList = ["XS", "S", "M", "X", "L", "XL", "XXL"]

    let sizes = value.split(",").map((x) => x.trim().toUpperCase());
    for (field of sizes) {
        if (!sizeList.includes(field)) return e.push(` { Sizes must be in ${sizeList} }`);
    }
    return { $in: sizes };

}
const isPriceGreaterThan = function (value, e) {

    if (value.trim() == "") { return e.push("{ PriceGreaterThan can not be empty }") }
    let priceRegex = /^(0|[1-9]\d*)(\.\d+)?$/;
    if (priceRegex.test(value) == false) { return e.push(` { priceGreaterThan must be in positive number }`); }
    return { $gte: value };

}

const isPriceLessThan = function (value, e) {

    if (value.trim() == "") { return e.push("{ PriceLessThan can not be empty }") }
    let priceRegex = /^(0|[1-9]\d*)(\.\d+)?$/;
    if (priceRegex.test(value) == false) { return e.push(` { priceLessThan must be in positive number }`); }
    return { $lte: value };
}
const isPriceSort = function (value, e) {
    if (!(value.trim() == "-1" || value.trim() == "1")) { return e.push(` { priceSort must be in 1/-1 }`); }
    return true
}


module.exports = { validTitle, validDescription, validPrice, validCurrencyId, validCurrencyFormat, validIsFreeShipping, validProductImage, validStyle, validAvailableSizes, validInstallments, validName, validSize, isPriceGreaterThan, isPriceLessThan, isPriceSort, validRest } 