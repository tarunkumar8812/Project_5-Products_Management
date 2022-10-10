const userModel = require("../models/userModel");
const {
  isValidString,
  isValidEmail,
  isValidUrl,
  isValidPhn,
  isValidPass,
  isValidPincode,
} = require("../validations/validator");

async function createUser(req, res) {
  try {
    const data = req.body;
    if (!Object.keys(data).includes("address")) {
      return res.status(400).send({
        status: false,
        message: "address is required",
      });
    }
    data.address = JSON.parse(data.address);
    const requiredFields = [
      "fname",
      "lname",
      "email",
      "profileImage",
      "phone",
      "password",
      "address",
    ];
    let err = [];
    const addressFields = ["street", "city", "pincode"];
    const sb_Fields = ["shipping", "billing"];
    const unique = ["email", "phone"];
    for (field of requiredFields) {
      if (!Object.keys(data).includes(field)) {
        err.push(`${field} is required`);
        continue;
      }
      if (field === "address") {
        if (typeof data[field] !== "object") {
          err.push(`${field} must be in object format`);
          continue;
        }
        for (item of sb_Fields) {
          if (!Object.keys(data[field]).includes(item)) {
            err.push(`${item} is required`);
            continue;
          }
          let obj = data[field];
          let pObj = obj[item];
          for (key of addressFields) {
            if (!Object.keys(pObj).includes(key)) {
              err.push(`${key} is required`);
              continue;
            }
            if (key === "pincode") {
              if (!isValidPincode(pObj[key])) {
                err.push(`${key} must be in 6 digits`);
              }
              continue;
            }
            if (!isValidString(pObj[key])) {
              err.push(`${key} must be in string format`);
            }
          }
        }
        continue;
      }
      if (!isValidString(data[field])) {
        err.push(`${field} must be in string format`);
        continue;
      }
      if (field === "profileImage") {
        if (!isValidUrl(data[field])) err.push(`invalid ${field}`);
      }
      if (field === "password") {
        if (!isValidPass(data[field]))
          err.push(
            "password should contain at least (1 lowercase, uppercase ,numeric alphabetical character and at least one special character and also The string must be  between 8 characters to 16 characters)"
          );
      }
    }
    for (uni of unique) {
      if (!Object.keys(data).includes(uni)) {
        continue;
      }
      if (uni === "email") {
        if (!isValidEmail(data[uni])) {
          err.push(`invalid ${uni}`);
          continue;
        }
      }
      if (uni === "phone") {
        if (!isValidPhn(data[uni])) {
          err.push(`invalid ${uni} number`);
          continue;
        }
      }
      let emp = {};
      emp[uni] = data[uni];
      let doc = await userModel.findOne(emp);
      if (doc) {
        err.push(`${uni} is already taken`);
      }
    }

    if (err.length > 0) {
      return res.status(400).send({
        status: false,
        message: err.join(", "),
      });
    }

    const createdData = await userModel.create(data);
    return res.status(201).send({ status: true, data: createdData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createUser };
