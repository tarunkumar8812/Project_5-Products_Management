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
    for (field of requiredFields) {
      if (!Object.keys(data).includes(field)) {
        return res.status(400).send({
          status: false,
          message: `${field} is required`,
        });
      }
    }
    const addressFields = ["street", "city", "pincode"];
    const sb_Fields = ["shipping", "billing"];
    const unique = ["email", "phone"];
    for (field of requiredFields) {
      if (field === "address") {
        if (typeof data[field] !== "object") {
          return res.status(400).send({
            status: false,
            message: `${field} must be in object format`,
          });
        }
        for (item of sb_Fields) {
          let obj = data[field];
          let pObj = obj[item];
          for (key of addressFields) {
            if (key === "pincode") {
              if (!isValidPincode(pObj[key])) {
                return res.status(400).send({
                  status: false,
                  message: `${key} must be in 6 digits`,
                });
              }
              continue;
            }
            if (!isValidString(pObj[key])) {
              return res.status(400).send({
                status: false,
                message: `${key} must be in string format`,
              });
            }
          }
        }
        continue;
      }
      if (!isValidString(data[field])) {
        return res.status(800).send({
          status: false,
          message: `${field} must be in string format`,
        });
      }
      if (field === "profileImage") {
        if (!isValidUrl(data[field]))
          return res.status(400).send({
            status: false,
            message: `invalid ${field}`,
          });
      }
      for (uni of unique) {
        if (uni === "email") {
          if (!isValidEmail(data[uni]))
            return res.status(400).send({
              status: false,
              message: `invalid ${uni}`,
            });
        }
        if (uni === "phone") {
          if (!isValidPhn(data[uni]))
            return res.status(400).send({
              status: false,
              message: `invalid ${uni}`,
            });
        }
        let emp = {};
        emp[uni] = data[uni];
        let doc = await userModel.findOne(emp);
        if (doc) {
          return res.status(400).send({
            status: false,
            message: `${uni} is already taken`,
          });
        }
      }
    }

    const createdData = await userModel.create(data);
    return res.status(201).send({ status: true, data: createdData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createUser };
