const productModel = require("../models/productModel");
const { uploadFile } = require("../AWS/aws");
const {
  isValidString,
  isValidUrl,
  isValidPrice,
  isValidCurencyId,
  isValidCurencyFormat,
} = require("../validations/validator");

const createProduct = async function (req, res) {
  try {
    const data = req.body;
    let files = req.files;

    console.log(data);

    const {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
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
          .send({ status: false, msg: `${field} is required` });
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

    if (currencyId) {
      if (!isValidCurencyId(currencyId)) {
        return res
          .status(400)
          .send({ status: false, msg: "currencyId must be in INR " });
      }
    }

    if (currencyFormat == "") {
      return res
        .status(400)
        .send({ status: false, msg: "CurencyFormat should not be empty " });
    }
    if (currencyFormat) {
      if (!isValidCurencyFormat(currencyFormat.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "CurencyFormat must be in ₹ " });
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
    }
    if (style) {
      if (!isValidString(style.trim())) {
        return res
          .status(400)
          .send({ status: false, msg: "style must be in string " });
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
      let data = await productModel.findOne({ title });
      if (data) {
        return res
          .status(409)
          .send({ status: false, msg: "title is already exists" });
      }
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
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createProduct };
