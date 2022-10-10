const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const {
  isValidString,
  isValidEmail,
  isValidUrl,
  isValidPhn,
  isValidPass,
  isValidPincode,
  validEmail,
  validPW_4_Login
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
              err.push(`${key} is required in ${item}`);
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
        bcrypt.hash(data[field], 5, function (err, hash) {
          // Store hash in your password DB.
          if (err) {
            err.push(err.message);
          }
          data.password = hash;
        });
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





// --------------------------- Login API --------------------------

const login = async function (req, res) {
  try {
    const creadentials = req.body

    let { email, password, ...rest } = creadentials

    // ---------------- Applying Validation ------------
    if (Object.keys(rest).length > 0) {
      return res.status(400).send({ status: false, message: `You can not fill these:- ( ${Object.keys(rest)} )field` })
    }

    if (validEmail(email) != true) return res.status(400).send({ status: false, message: `${validEmail(email)}` })

    if (validPW_4_Login(password) != true) return res.status(400).send({ status: false, message: `${validPW_4_Login(password)}` })

    // --------- checking creadentials in DB -------------
    let user_in_DB = await userModel.findOne({ email });
    if (!user_in_DB) return res.status(401).send({ status: false, message: "invalid credentials (email or the password is not corerct)" })

    bcrypt.compare(password, user_in_DB.password, function (err, result) {
      if (result !== true) {
        return res.status(401).send({ success: false, message: 'passwords do not match' });
      } else {

        // ---------- creating JWT Token ------------
        let token = jwt.sign(
          {
            userId: user_in_DB._id.toString(),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // After 24 hour it will expire 
            iat: Math.floor(Date.now() / 1000)
          }, "FunctionUp Group No 57");

        res.setHeader("x-api-key", token);

        let data = {
          token: token,
          userId: user_in_DB._id.toString(),
        }

        return res.status(200).send({ status: true, message: "Token has been successfully generated.", data: data });
      }

    });

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

module.exports = { createUser, login };
