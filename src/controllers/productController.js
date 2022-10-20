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
      "availableSizes",
    ];

    for (field of requiredFields) {
      if (!Object.keys(data).includes(field)) {
        return res
          .status(400)
          .send({ status: false, message: `${field} is required` });
      }
    }

    const arr = [
      "title",
      "description",
      "price",
      "currencyId",
      "currencyFormat",
      "isFreeShipping",
      "style",
      "availableSizes",
      "installments",
    ];

    for (field of arr) {
      if (Object.keys(data).includes(field)) {
        if (data[field].trim() === "") {
          return res
            .status(400)
            .send({ status: false, message: `required value of the ${field}` });
        }
      }
    }

    if (!isValidString(description.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "description must be in string" });
    }

    if (!isValidPrice(price.trim())) {
      return res.status(400).send({
        status: false,
        message: "price must be in number/decimal(ex:-125/12.5)",
      });
    }

    if (!isValidCurencyId(currencyId.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "currencyId must be in INR" });
    }

    if (!isValidCurencyFormat(currencyFormat.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "CurencyFormat must be in ₹" });
    }

    if (isFreeShipping) {
      if (!["true", "false"].includes(isFreeShipping.trim())) {
        return res.status(400).send({
          status: false,
          message: "isFreeShipping must be in true/false",
        });
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
          .send({ status: false, message: "style must be in string" });
      }
    }

    let listOfSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
    let sizes = availableSizes.split(",").map((x) => x.trim().toUpperCase());
    for (field of sizes) {
      if (!listOfSizes.includes(field)) {
        return res.status(400).send({
          status: false,
          message: `availableSizes must be in ${listOfSizes.join(", ")}`,
        });
      }
    }
    data.availableSizes = sizes;

    if (installments) {
      if (!isValidPrice(installments.trim())) {
        return res
          .status(400)
          .send({ status: false, message: "installments must be in numbers " });
      }
    }

    if (!isValidString(title.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "title must be in string" });
    }
    let titleInDb = await productModel.findOne({ title });
    if (titleInDb) {
      return res
        .status(409)
        .send({ status: false, message: "title is already exists" });
    }

    if (files.length === 0 || files[0].fieldname !== "productImage") {
      return res
        .status(400)
        .send({
          status: false,
          message: "required productImage as key and file as value",
        });
    }

    if (
      !(
        files[0].mimetype == "image/png" ||
        files[0].mimetype == "image/jpg" ||
        files[0].mimetype == "image/jpeg"
      )
    ) {
      return res.status(400).send({
        status: false,
        message: "Only .png, .jpg and .jpeg format allowed!",
      });
    }

    //uploading productImage file in AWS
    let uploadedFileURL = await uploadFile(files[0]);

    data.productImage = uploadedFileURL;

    //creating product
    let createProductData = await productModel.create(data);
    return res.status(201).send({
      status: true,
      message: "Success",
      data: createProductData,
    });
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
            .send({ status: false, message: `required value of the ${field}` });
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
          .send({ status: false, message: "size must be in string" });
      }
      let listOfSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      if (size.length > 0) {
        let sizes = size.split(",").map((x) => x.trim().toUpperCase());
        for (field of sizes) {
          if (!listOfSizes.includes(field)) {
            return res.status(400).send({
              status: false,
              message: `Sizes must be in ${listOfSizes.join(", ")}`,
            });
          }
        }
        obj.availableSizes = { $in: sizes };
      } else {
        if (!listOfSizes.includes(size.trim().toUpperCase())) {
          return res.status(400).send({
            status: false,
            message: `Sizes must be in ${listOfSizes.join(", ")}`,
          });
        }
        obj.availableSizes = { $in: size.trim().toUpperCase() };
      }
    }

    //checking name
    if (name) {
      if (!isValidString(name.trim())) {
        return res
          .status(400)
          .send({ status: false, message: "name must be in string" });
      }
      obj.title = { $regex: `${name}` };
    }

    //checking priceGreaterThan
    if (priceGreaterThan) {
      if (!isValidPrice(priceGreaterThan.trim())) {
        return res.status(400).send({
          status: false,
          message: "priceGreaterThan must be in positive number",
        });
      }
      obj.price = { $gte: priceGreaterThan };
    }

    //checking priceLessThan
    if (priceLessThan) {
      if (!isValidPrice(priceLessThan.trim())) {
        return res.status(400).send({
          status: false,
          message: "priceLessThan must be in positive number",
        });
      }
      obj.price = { $lte: priceLessThan };
    }

    if (priceGreaterThan && priceLessThan) {
      obj.price = { $gte: priceGreaterThan, $lte: priceLessThan };
    }

    obj.isDeleted = false;

    //checking priceSort
    if (priceSort) {
      if (!(priceSort == "-1" || priceSort == "1")) {
        return res
          .status(400)
          .send({ status: false, message: "priceSort must be in 1/-1" });
      }
      let getProduct = await productModel.find(obj).sort({ price: +priceSort });

      if (getProduct.length === 0) {
        return res
          .status(404)
          .send({ status: false, message: "products not found" });
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
      return res
        .status(404)
        .send({ status: false, message: "products not found" });
    }
    return res.status(200).send({
      status: true,
      message: "Success",
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
        .send({ status: false, message: "Please Enter Valid productId" });
    }
    let check = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!check) {
      return res
        .status(404)
        .send({ status: false, message: "product not found" });
    }
    return res.status(200).send({ status: true, data: check });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

//===============================updateProductByParam==========================//
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

    //checking productId in params
    if (productId === ":productId") {
      return res
        .status(400)
        .send({ status: false, message: "productId required" });
    }
    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter Valid productId" });
    }

    //checking atleast one data
    if (Object.keys(data).length == 0 && files === undefined) {
      return res.status(400).send({
        status: false,
        message: "for updation atleast one key value pair is required",
      });
    }

    //checking other than required fields
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
      if (Object.keys(data).includes(field)) {
        if (
          field === "productImage" &&
          (files === undefined || files.length === 0)
        ) {
          return res
            .status(400)
            .send({ status: false, message: "required productImage file" });
        }
        if (data[field].trim() === "") {
          return res
            .status(400)
            .send({ status: false, message: `required value of the ${field}` });
        }
      }
    }

    if (description) {
      if (!isValidString(description)) {
        return res
          .status(400)
          .send({ status: false, message: "description must be in string" });
      }
    }

    if (price) {
      if (!isValidPrice(price)) {
        return res
          .status(400)
          .send({ status: false, message: "price must be in number" });
      }
    }

    if (isFreeShipping) {
      if (!["true", "false"].includes(isFreeShipping.trim())) {
        return res.status(400).send({
          status: false,
          message: "isFreeShipping must be in true/false",
        });
      }
      if (isFreeShipping.trim() === "true") {
        data["isFreeShipping"] = true;
      } else {
        data["isFreeShipping"] = false;
      }
    }

    if (style) {
      if (!isValidString(style.trim())) {
        return res
          .status(400)
          .send({ status: false, message: "style must be in string" });
      }
    }

    if (installments) {
      if (!isValidPrice(installments.trim())) {
        return res
          .status(400)
          .send({ status: false, message: "installments must be in numbers " });
      }
    }

    if (title) {
      if (!isValidString(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Please Enter The Valid title " });
      }
      let checkTitle = await productModel.findOne({ title });
      if (checkTitle) {
        return res
          .status(409)
          .send({ status: false, message: "title is already exists" });
      }
    }

    //checking in DB
    let check = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!check) {
      return res
        .status(404)
        .send({ status: false, message: "product not founded" });
    }

    if (availableSizes) {
      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      let sizes = availableSizes.split(",").map((x) => x.trim().toUpperCase());
      for (field of sizes) {
        if (!arr.includes(field)) {
          return res.status(400).send({
            status: false,
            message: `availableSizes must be in ${arr.join(", ")}`,
          });
        }
      }
      for (field of sizes) {
        if (check.availableSizes.includes(field)) {
          //remove size
          check.availableSizes.splice(check.availableSizes.indexOf(field), 1);
          data.availableSizes = check.availableSizes;
        } else {
          //Add size
          check.availableSizes.push(field);
          data.availableSizes = check.availableSizes;
        }
      }
    }
    // console.log(files);

    //checking file is there or not , as files comes in array
    if (files && files.length > 0) {
      if (
        !(
          files[0].mimetype == "image/png" ||
          files[0].mimetype == "image/jpg" ||
          files[0].mimetype == "image/jpeg"
        )
      ) {
        return res.status(400).send({
          status: false,
          message: "Only .png, .jpg and .jpeg format allowed!",
        });
      }

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

//================deteleteByparams===================//
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
        .send({ status: false, message: "Please Enter Valid productId" });
    }

    const deleteProduct = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      {
        $set: { isDeleted: true, deletedAt: Date.now() },
      }
    );
    if (!deleteProduct) {
      return res
        .status(404)
        .send({ status: false, message: "product not found" });
    }

    return res
      .status(200)
      .send({ status: true, message: "deleted succefully" });
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

