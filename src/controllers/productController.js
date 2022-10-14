const productModel = require("../models/productModel");
const { uploadFile } = require("../AWS/aws");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {
  isValidString,
  isValidPrice,
  isValidCurencyId,
  isValidCurencyFormat,
} = require("../validations/validator");

const createProduct = async function (req, res) {
  try {
    const data = req.body;
    let files = req.files;

    // console.log(files);

    const {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      productImage,
      style,
      availableSizes,
      installments,
      ...rest
    } = data;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please fill data in body" });

    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
      });
    }

    const requiredFields = [
      "title",
      "description",
      "price",
      "currencyId",
      "currencyFormat",
      "productImage",
      "availableSizes",
    ];

    for (field of requiredFields) {
      if (!Object.keys(data).includes(field)) {
        if (field === "productImage" && files.length > 0) {
          continue;
        }
        return res
          .status(400)
          .send({ status: false, msg: `${field} is required` });
      }
    }

    const arr = [
      "title",
      "description",
      "price",
      "currencyId",
      "currencyFormat",
      "isFreeShipping",
      "productImage",
      "style",
      "availableSizes",
      "installments",
    ];

    for (field of arr) {
      if (Object.keys(data).includes(field)) {
        if (data[field].trim() === "") {
          return res
            .status(400)
            .send({ status: false, msg: `required value of the ${field}` });
        }
      }
    }

    if (!isValidString(description.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: "description must be in string" });
    }

    if (!isValidPrice(price.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: "price must be in number/decimal" });
    }

    if (!isValidCurencyId(currencyId.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: "currencyId must be in INR" });
    }

    if (!isValidCurencyFormat(currencyFormat.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: "CurencyFormat must be in ₹" });
    }

    if (isFreeShipping) {
      if (!["true", "false"].includes(isFreeShipping.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "isFreeShipping must be in true/false" });
      }
      if (isFreeShipping.trim() === "true") {
        data.isFreeShipping = true;
      }
      data.isFreeShipping = false;
    }

    if (style) {
      if (!isValidString(style.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "style must be in string" });
      }
    }

    if (!isValidString(title.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: "title must be in string" });
    }
    let listOfSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
    let sizes = availableSizes.split(",");
    for (field of sizes) {
      if (!listOfSizes.includes(field)) {
        return res.status(400).send({
          status: false,
          msg: `availableSizes must be in ${listOfSizes.join(", ")}`,
        });
      }
    }
    data.availableSizes = sizes;

    if (installments) {
      if (!isValidPrice(installments.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "installments must be in numbers " });
      }
    }

    if (!isValidString(title)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid title " });
    }
    let titleInDb = await productModel.findOne({ title });
    if (titleInDb) {
      return res
        .status(409)
        .send({ status: false, msg: "title is already exists" });
    }

    //checking file is there or not , as files comes in array
    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);

      data.productImage = uploadedFileURL;

      //creating product
      let createProductData = await productModel.create(data);
      return res.status(201).send({
        status: true,
        data: createProductData,
      });
    } else {
      return res.status(400).send({ message: "required productImage file" });
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=============================getProductsByQuerys=====================//
async function getProduct(req, res) {
  try {
    let data = req.query;

    let { size, name, priceGreaterThan, priceLessThan, priceSort, ...rest } =
      data;

    const arr = [
      "size",
      "name",
      "priceGreaterThan",
      "priceLessThan",
      "priceSort",
    ];

    for (field of arr) {
      if (Object.keys(data).includes(field)) {
        if (data[field].trim() === "") {
          return res
            .status(400)
            .send({ status: false, msg: `required value of the ${field}` });
        }
      }
    }

    let obj = {};

    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not use these :- ( ${Object.keys(rest)} ) filters`,
      });
    }

    //checking size
    if (size) {
      if (!isValidString(size.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "size must be in string" });
      }
      let listOfSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      let sizes = size.split(",");
      for (field of sizes) {
        if (!listOfSizes.includes(field)) {
          return res.status(400).send({
            status: false,
            msg: `Sizes must be in ${listOfSizes.join(", ")}`,
          });
        }
      }
      obj.availableSizes = { $in: sizes };
    }

    //checking name
    if (name) {
      if (!isValidString(name.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "name must be in string" });
      }
      obj.title = { $regex: `${name}` };
    }

    //checking priceGreaterThan
    if (priceGreaterThan) {
      if (!isValidPrice(priceGreaterThan.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "priceGreaterThan must be in number" });
      }
      obj.price = { $gte: priceGreaterThan };
    }

    //checking priceLessThan
    if (priceLessThan) {
      if (!isValidPrice(priceLessThan.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "priceLessThan must be in number" });
      }
      obj.price = { $lte: priceLessThan };
    }

    obj.isDeleted = false;

    //checking priceSort
    if (priceSort) {
      if (!(priceSort !== "-1" || priceSort !== "1")) {
        return res
          .status(400)
          .send({ status: false, msg: "priceSort must be in 1/-1" });
      }
      let getProduct = await productModel.find(obj).sort({ price: +priceSort });
      
      if (getProduct.length === 0) {
        return res
          .status(404)
          .send({ status: false, msg: "products not found" });
      }
      return res.status(200).send({
        status: true,
        data: getProduct,
      });
    }

    // console.log(obj);

    //to find products
    let getProduct = await productModel.find(obj);
    if (getProduct.length === 0) {
      return res.status(404).send({ status: false, msg: "products not found" });
    }
    return res.status(200).send({
      status: true,
      data: getProduct,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

//=============================getProductByParam=====================//
async function getProductByParam(req, res) {
  try {
    let productId = req.params.productId;
    if (productId === ":productId") {
      return res
        .status(400)
        .send({ status: false, message: "productId required" });
    }
    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter Valid productId" });
    }
    let check = await productModel.findOne({ productId, isDeleted: false });
    if (!check) {
      return res.status(404).send({ status: false, msg: "product not found" });
    }
    return res.status(200).send({ status: true, data: check });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

//-----  updateProductByParam ------------

async function updateProductByParam(req, res) {
  try {
    let productId = req.params.productId;
    let data = req.body;
    // console.log(data);
    let {
      title,
      description,
      price,
      isFreeShipping,
      style,
      productImage,
      availableSizes,
      installments,
      ...rest
    } = data;
    let files = req.files;

    // console.log(files);

    // -------------------- checking productId in params ---------
    if (productId === ":productId") {
      return res
        .status(400)
        .send({ status: false, message: "productId required" });
    }
    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter Valid productId" });
    }

    // -------------------- checking atleast one data ---------
    // console.log(files);

    if (Object.keys(data).length == 0 && files === undefined) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter Valid Details" });
    }

    // -------------------- checking other than required fields ---------
    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not use these :- ( ${Object.keys(rest)} ) filters`,
      });
    }

    const arr = [
      "title",
      "description",
      "price",
      "currencyId",
      "currencyFormat",
      "isFreeShipping",
      "productImage",
      "style",
      "availableSizes",
      "installments",
    ];

    for (field of arr) {
      if (data[field].trim() === "") {
        return res
          .status(400)
          .send({ status: false, msg: `required value of the ${field}` });
      }
    }

    if (description) {
      if (!isValidString(description)) {
        return res
          .status(400)
          .send({ status: false, msg: "description must be in string" });
      }
    }

    if (price) {
      if (!isValidPrice(price)) {
        return res
          .status(400)
          .send({ status: false, msg: "price must be in number" });
      }
    }

    if (isFreeShipping) {
      if (!["true", "false"].includes(isFreeShipping.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "isFreeShipping must be in true/false" });
      }
      if (isFreeShipping.trim() === "true") {
        data.isFreeShipping = true;
      }
      data.isFreeShipping = false;
    }

    if (style) {
      if (!isValidString(style.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "style must be in string" });
      }
    }

    if (availableSizes) {
      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      let sizes = availableSizes.split(",");
      for (field of sizes) {
        if (!arr.includes(field)) {
          return res.status(400).send({
            status: false,
            msg: `availableSizes must be in ${arr.join(", ")}`,
          });
        }
      }
      data.availableSizes = sizes;
    }

    if (installments) {
      if (!isValidPrice(installments.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "installments must be in numbers " });
      }
    }

    if (title) {
      if (!isValidString(title)) {
        return res
          .status(400)
          .send({ status: false, msg: "Please Enter The Valid title " });
      }
      let checkTitle = await productModel.findOne({ title });
      if (checkTitle) {
        return res
          .status(409)
          .send({ status: false, msg: "title is already exists" });
      }
    }

    // ----------------------- checking in DB ---------------
    let check = await productModel.findOne({ productId, isDeleted: false });
    if (!check) {
      return res
        .status(404)
        .send({ status: false, msg: "product not founded" });
    }

    // console.log(files);

    //checking file is there or not , as files comes in array
    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);

      data.productImage = uploadedFileURL;

      //creating product
      let updatedProductData = await productModel.findByIdAndUpdate(
        productId,
        data,
        {
          new: true,
        }
      );
      return res.status(200).send({
        status: true,
        data: updatedProductData,
      });
    } else {
      let updatedProductData = await productModel.findByIdAndUpdate(
        productId,
        data,
        {
          new: true,
        }
      );
      return res.status(200).send({
        status: true,
        data: updatedProductData,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// ------------------------------------deteleteByparams--------------------------------------------

async function deleteProduct(req, res) {
  try {
    const productId = req.params.productId;

    if (productId === ":productId") {
      return res
        .status(400)
        .send({ status: false, message: "productId required" });
    }
    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter Valid productId" });
    }

    const deleteProduct = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      {
        $set: { isDeleted: true, deletedAt: Date.now() },
      }
    );
    if (!deleteProduct) {
      return res.status(404).send({ status: false, msg: "product not found" });
    }

    return res.status(200).send({ status: true, msg: "deleted succefully" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = {
  createProduct,
  getProduct,
  getProductByParam,
  updateProductByParam,
  deleteProduct,
};
