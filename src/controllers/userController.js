const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../AWS/aws");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const {
  isValidString,
  isValidEmail,
  isValidUrl,
  isValidPhn,
  isValidPass,
  isValidPincode,
  validEmail,
  validPW_4_Login,
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

    //files form form data
    let files = req.files;

    //checking file is there or not , as files comes in array
    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);

      data.profileImage = uploadedFileURL;

      //creating user
      let createUserData = await userModel.create(data);
      return res.status(201).send({
        status: true,
        data: createUserData,
      });
    } else {
      return res.status(400).send({ message: "No file Found" });
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// --------------------------- Login API --------------------------

const login = async function (req, res) {
  try {
    const credentials = req.body;

    let { email, password, ...rest } = credentials;

    // ---------------- Applying Validation ------------

    if (Object.keys(credentials).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please fill data in body" });

    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
      });
    }

    if (validEmail(email) != true)
      return res
        .status(400)
        .send({ status: false, message: `${validEmail(email)}` });

    if (validPW_4_Login(password) != true)
      return res
        .status(400)
        .send({ status: false, message: `${validPW_4_Login(password)}` });

    // --------- checking creadentials in DB -------------
    let user_in_DB = await userModel.findOne({ email });
    if (!user_in_DB)
      return res.status(401).send({
        status: false,
        message: "invalid credentials (email or the password is not correct)",
      });

    bcrypt.compare(password, user_in_DB.password, function (err, result) {
      if (result !== true) {
        return res
          .status(401)
          .send({ success: false, message: "passwords do not match" });
      } else {
        // ---------- creating JWT Token ------------

        let token = jwt.sign(
          {
            userId: user_in_DB._id.toString(),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // After 24 hour it will expire
            iat: Math.floor(Date.now() / 1000),
          },
          "FunctionUp Group No 23"
        );

        res.setHeader("x-api-key", token);

        let data = {
          token: token,
          userId: user_in_DB._id.toString(),
        };

        return res.status(200).send({
          status: true,
          message: "Token has been successfully generated.",
          data: data,
        });
      }
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// --------------------------- getUser API --------------------------

const getUser = async function (req, res) {
  try {
    const userId = req.params.userId;
    if (userId === ":userId") {
      return res
        .status(400)
        .send({ status: false, message: "userId required" });
    }
    if (!ObjectId.isValid(userId)) {
      return res.status(400).send({ status: false, message: "invalid userId" });
    }

    if (req.decoded.userId === userId) {
      const getUser = await userModel.findById(userId);
      if (!getUser) {
        return res
          .status(404)
          .send({ status: false, message: "user not exist" });
      }
      return res.status(200).send({ status: true, data: getUser });
    }
    return res.status(401).send({ status: false, message: "not auth" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// --------------------------- updateUser API --------------------------

const userUpdate = async function (req, res) {
  let userid = req.params.userId;
  let body = req.body;
  let files = req.files;

  if (!ObjectId.isValid(userid)) {
    return res
      .status(400)
      .send({ status: false, msg: "Please Enter Valid userID" });
  }

  if (Object.keys(body).length == 0 && files.length === 0) {
    return res
      .status(400)
      .send({ status: false, msg: "Please Enter Valid Details" });
  }

  let { fname, lname, email, phone, password, address } = body;

  if (fname) {
    if (!isValidString(fname)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid fname " });
    }
  }

  if (lname) {
    if (!isValidString(lname)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid Lname " });
    }
  }

  if (email) {
    if (!isValidString(email)) {
      return res
        .status(400)
        .send({ status: false, msg: "email must be in string format" });
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid email  " });
    }
  }

  if (phone) {
    if (!isValidString(phone)) {
      return res
        .status(400)
        .send({ status: false, msg: "phone number must be in string format" });
    }
    if (!isValidPhn(phone)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid Phone number  " });
    }
  }

  if (password) {
    if (!isValidString(password)) {
      return res
        .status(400)
        .send({ status: false, msg: "password must be in string format" });
    }
    if (!isValidPass) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid password  " });
    }
    const encryptPassword = await bcrypt.hash(password, 5);
    body.password = encryptPassword;
  }

  let obj = { fname, lname, email, phone, password };

  //checking file is there or not , as files comes in array
  if (files && files.length > 0) {
    if (files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);

      obj.profileImage = uploadedFileURL;
    }
  }

  if (address) {
    let { shipping, billing } = address;
    let arr = [shipping, billing];
    for (field of arr) {
      if (field) {
        let { street, city, pincode } = field;
        if (street) {
          if (!isValidString(street)) {
            return res
              .status(400)
              .send({ status: false, msg: "Please Enter The Valid Street  " });
          }
          if (field == shipping) {
            obj["address.shipping.street"] = field.street;
          }
          if (field == billing) {
            obj["address.billing.street"] = field.street;
          }
        }
        if (city) {
          if (!isValidString(city)) {
            return res
              .status(400)
              .send({ status: false, msg: "Please Enter The Valid city " });
          }
          if (field == shipping) {
            obj["address.shipping.city"] = field.city;
          }
          if (field == billing) {
            obj["address.billing.city"] = field.city;
          }
        }
        if (pincode) {
          if (!isValidPincode(pincode)) {
            return res
              .status(400)
              .send({ status: false, msg: "Please Enter The Valid pincode" });
          }
          if (field == shipping) {
            obj["address.shipping.pincode"] = field.pincode;
          }
          if (field == billing) {
            obj["address.billing.pincode"] = field.pincode;
          }
        }
      }
    }
  }

  let unique = ["email", "phone"];
  for (field of unique) {
    let emp = {};
    emp[field] = body[field];
    let doc = await userModel.findOne(emp);
    if (doc) {
      return res
        .status(409)
        .send({ status: false, msg: `${field} is already exists` });
    }
  }

  let updation = await userModel.findByIdAndUpdate({ _id: userid }, obj, {
    new: true,
  });

  return res.status(200).send({ status: true, Data: updation });
};

module.exports = { createUser, login, getUser, userUpdate };
