const productModel = require("../models/productModel");
const { uploadFile } = require("../AWS/aws");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const { validTitle, validDescription, validPrice, validCurrencyId, validCurrencyFormat, validIsFreeShipping, validProductImage, validStyle, validAvailableSizes, validInstallments, validSize, validName, isPriceGreaterThan, isPriceLessThan, } = require("../validations/validProduct");

const { V_productIdInParam, validRest } = require("../validations/utils")

// ------------------------------------------ cretate product ------------------------------------------

const createProduct = async function (req, res) {
  try {
    const data = req.body;
    let files = req.files;


    // ------------------ Validation part ----------------
    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });

    let errors = []

    const requiredFields = ["title", "description", "price", "currencyId", "currencyFormat", "availableSizes",];

    //-------- cheking mandatory fields --------
    for (field of requiredFields) {
      if (!Object.keys(data).includes(field)) { errors.push(field) }
    }

    if (files.length == 0) { errors.push("ProductImage") }

    if (errors.length > 0) { return res.status(400).send({ status: false, message: ` ( ${errors} ) is/are mandatory` }); }


    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments, ...rest } = data;


    validDescription(description, errors)

    validPrice(price, errors)

    validCurrencyId(currencyId, errors)

    validCurrencyFormat(currencyFormat, errors)

    validStyle(style, errors)

    validInstallments(installments, errors)

    availableSizes = validAvailableSizes(availableSizes, errors)

    isFreeShipping = validIsFreeShipping(isFreeShipping, errors)

    productImage = validProductImage(files, errors)

    validTitle(title, errors)

    validRest(rest, errors)

    if (errors.length > 0) { return res.status(400).send({ status: false, message: ` ( ${errors} )` }); }

    //  ------- checking uniqueness of Title -------
    let title_in_DB = await productModel.findOne({ title });

    if (title_in_DB) return res.status(409).send({ status: false, message: "title is already exists" });


    // --------------- using AWS to Store images ---------------
    data.productImage = await uploadFile(files[0]);

    //------------------creating product data------------------
    let createdProduct = await productModel.create(data);

    return res.status(201).send({ status: true, message: "Success", data: createdProduct, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};


// ---------------------------------------- getProductsByQuerys ----------------------------------------

async function getProductByQuery(req, res) {
  try {
    let data = req.query;

    let errors = []

    let filter = {};

    let { size, name, priceGreaterThan, priceLessThan, priceSort, ...rest } = data;

    //-------------- all validations--------------

    if (size) { filter["availableSizes"] = validSize(size, errors) }

    if (name) { filter["title"] = validName(name, errors) }

    if (priceGreaterThan) { filter["price"] = isPriceGreaterThan(priceGreaterThan, errors) }

    if (priceLessThan) { filter["price"] = isPriceLessThan(priceLessThan, errors) }

    if (priceGreaterThan && priceLessThan) { filter["price"] = { $gte: priceGreaterThan, $lte: priceLessThan }; }

    validRest(rest, errors)

    if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });

    //---------- find products with sorting -----------------
    if (priceSort) {
      if (!(priceSort == "-1" || priceSort == "1")) return res.status(400).send({ status: false, message: "priceSort must be in 1/-1" });

      let product_in_DB = await productModel.find(filter).sort({ price: +priceSort });

      if (product_in_DB.length === 0) return res.status(404).send({ status: false, message: "products not found" });

      return res.status(200).send({ status: true, data: product_in_DB, });
    }

    //---------- find products without sorting -----------------
    let product_in_DB = await productModel.find(filter);

    if (product_in_DB.length === 0) return res.status(404).send({ status: false, message: "products not found" });

    return res.status(200).send({ status: true, message: "Success", data: product_in_DB, });


  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}


//----------------------------------------- getProductByParam ----------------------------------------- 
async function getProductByParam(req, res) {
  try {
    let productId = req.params.productId;

    if (productId === ":productId") return res.status(400).send({ status: false, message: "productId required" });

    if (!ObjectId.isValid(productId)) return res.status(400).send({ status: false, message: "Please Enter Valid productId" });

    let product_in_DB = await productModel.findOne({ _id: productId, isDeleted: false, });

    if (!product_in_DB) return res.status(404).send({ status: false, message: "product not found" });

    return res.status(200).send({ status: true, message: "Success", data: product_in_DB });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

//--------------------------------------- updateProductByParam ---------------------------------------
async function updateProductByParam(req, res) {
  try {
    let productId = req.params.productId;
    let data = req.body;
    let files = req.files;


    //checking atleast one data
    if (Object.keys(data).length == 0 && files === undefined) return res.status(400).send({ status: false, message: "for updation atleast one key value pair is required", });

    let toUpdate = {}
    let errors = []

    let { title, description, price, isFreeShipping, style, productImage, availableSizes, installments, ...rest } = data;

    V_productIdInParam(productId, errors)

    if (validDescription(description, errors) == true) { toUpdate["description"] = description }

    if (validPrice(price, errors) == true) { toUpdate["price"] = price }

    toUpdate["isFreeShipping"] = (validIsFreeShipping(isFreeShipping, errors))

    if (validStyle(style, errors) == true) { toUpdate["style"] = style }

    validProductImage(files, errors)

    let sizeList = validAvailableSizes(availableSizes, errors)

    if (validTitle(title, errors) == true) { toUpdate["title"] = title }

    validRest(rest, errors)



    if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });

    // --------------- checking uniquness of Title ---------------
    if (title) {
      let title_in_DB = await productModel.findOne({ title });

      if (title_in_DB) return res.status(409).send({ status: false, message: "title is already exists" });
    }


    // ----------------- checking in product DB -----------------
    let product_in_DB = await productModel.findOne({ _id: productId, isDeleted: false, });

    if (!product_in_DB) return res.status(404).send({ status: false, message: "product not founded" });


    if (availableSizes) {

      for (field of sizeList) {
        if (product_in_DB.availableSizes.includes(field)) {
          //remove size
          product_in_DB.availableSizes.splice(product_in_DB.availableSizes.indexOf(field), 1);
          toUpdate["availableSizes"] = product_in_DB.availableSizes;
        } else {
          //Add size
          product_in_DB.availableSizes.push(field);
          toUpdate["availableSizes"] = product_in_DB.availableSizes;
        }
      }
    }

    //checking file is there or not , as files comes in array
    if (files.length > 0) { toUpdate["productImage"] = await uploadFile(files[0]); }

    let updatedProduct = await productModel.findByIdAndUpdate(productId, toUpdate, { new: true });

    return res.status(200).send({ status: true, data: updatedProduct, });


  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}



//---------------------------------------- deteleteByparams ----------------------------------------
async function deleteProduct(req, res) {
  try {
    const productId = req.params.productId;

    if (productId === ":productId") return res.status(400).send({ status: false, message: "productId required" });

    if (!ObjectId.isValid(productId)) return res.status(400).send({ status: false, message: "Please Enter Valid productId" });

    const deleteProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: Date.now() }, });

    if (!deleteProduct) return res.status(404).send({ status: false, message: "product not found" });

    return res.status(200).send({ status: true, message: "deleted succefully" });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createProduct, getProductByQuery, getProductByParam, updateProductByParam, deleteProduct, };