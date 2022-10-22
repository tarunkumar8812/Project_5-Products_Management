const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../AWS/aws");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const { isValidString, isValidEmail, isValidPhn, isValidPass, isValidPincode, validEmail, validPW_4_Login, } = require("../validations/validator");



// ----------------------------------- Register user API ----------------------------------

async function createUser(req, res) {
  try {
    const data = req.body;
    //files form form data
    let files = req.files;

    console.log(files);

    const { fname, lname, email, profileImage, phone, password, address, ...rest } = data;

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

    const requiredFields = ["fname", "lname", "email", "profileImage", "phone", "password", "address",];
    let err = [];
    const addressFields = ["street", "city", "pincode"];
    const sb_Fields = ["shipping", "billing"];
    const unique = ["email", "phone"];
    for (field of requiredFields) {
      //checking required fields
      if (field === "profileImage") {
        if (
          files[0].fieldname !== "profileImage" ||
          files === undefined ||
          files.length === 0
        ) {
          err.push("required profileImage as key and file as value");
        }
        continue;
      }
      if (!Object.keys(data).includes(field)) {
        err.push(`${field} key is required in request body`);
        continue;
      }
      //checking for valuse of the keys are given or not
      if (data[field].trim() === "") {
        err.push(`required value of the ${field}`);
        continue;
      }
      // checking required fields in address
      if (field === "address") {
        data.address = JSON.parse(data.address);
        if (typeof data[field] !== "object") {
          err.push(`${field} must be in object format`);
          continue;
        }
        for (item of sb_Fields) {
          if (!Object.keys(data[field]).includes(item)) {
            err.push(`${item} address is required`);
            continue;
          }
          let obj = data[field];
          let pObj = obj[item];
          for (key of addressFields) {
            if (!Object.keys(pObj).includes(key)) {
              err.push(`${key} is required in ${item} address`);
              continue;
            }
            if (key === "pincode") {
              if (typeof pObj[key] === "string") {
                if (!isValidPincode(pObj[key].trim())) {
                  err.push(`${key} must be in 6 digits in ${item}`);
                }
                continue;
              }
              if (!isValidPincode(pObj[key])) {
                err.push(`${key} must be in 6 digits in ${item}`);
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
      if (field === "fname") {
        if (!/^[A-Z a-z]+$/.test(data[field].trim())) {
          err.push("value of fname must be in letters");
          continue;
        }
        if (data[field].trim().length === 1) {
          err.push("value of fname must contain more then 1 letter");
        }
      }
      if (field === "lname") {
        if (!/^[A-Z a-z]+$/.test(data[field].trim())) {
          err.push("value of lname must be in letters");
          continue;
        }
        if (data[field].trim().length === 1) {
          err.push("value of lname must contain more then 1 letter");
        }
      }
      if (field === "password") {
        if (!isValidPass(data[field].trim()))
          err.push(
            "password should contain at least (1 lowercase, uppercase ,numeric alphabetical character and at least one special character and also The string must be  between 8 characters to 15 characters)"
          );
        bcrypt.hash(data[field].trim(), 5, function (err, hash) {
          // Store hash in your password DB.
          if (err) {
            err.push(err.message);
          }
          data.password = hash;
        });
      }
    }

    //checking uniqueness of email and phone
    for (uni of unique) {
      if (!Object.keys(data).includes(uni)) {
        continue;
      }
      if (data[uni].trim() === "") {
        continue;
      }
      if (uni === "email") {
        if (!isValidEmail(data[uni].trim())) {
          err.push(`invalid ${uni}`);
          continue;
        }
      }
      if (uni === "phone") {
        if (!isValidPhn(data[uni].trim())) {
          err.push(
            `invalid ${uni} number(Indian phone number starts with 6/7/8/9)`
          );
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

    // console.log(err);

    if (err.length > 0) {
      return res.status(400).send({
        status: false,
        message: err.join(", "),
      });
    }

    //checking file is there or not , as files comes in array
    if (files && files.length > 0) {
      //checking file type
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

      // Uploading image to S3 bucket and save it's public url in user document.
      let uploadedFileURL = await uploadFile(files[0]);
      data.profileImage = uploadedFileURL;

      //creating user
      let createUserData = await userModel.create(data);
      return res.status(201).send({
        status: true,
        message: "User created successfully",
        data: createUserData,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// --------------------------------------- Login API --------------------------------------

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
    let user_in_DB = await userModel.findOne({ email: email.trim() });
    if (!user_in_DB)
      return res.status(401).send({
        status: false,
        message: "invalid credentials (email or the password is incorrect)",
      });

    bcrypt.compare(
      password.trim(),
      user_in_DB.password,
      function (err, result) {
        if (result !== true) {
          return res
            .status(401)
            .send({ success: false, message: "incorrect password" });
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
            message: "User login successfull",
            data: data,
          });
        }
      }
    );
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// ------------------------------------- get User API ------------------------------------

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

    const getUser = await userModel.findById(userId);
    if (!getUser) {
      return res.status(404).send({ status: false, message: "user not exist" });
    }
    if (req.decoded.userId === userId) {
      return res
        .status(200)
        .send({ status: true, message: "User profile details", data: getUser });
    }
    return res.status(403).send({ status: false, message: "not auth" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// ------------------------------------ update User API -----------------------------------

const userUpdate = async function (req, res) {
  let userid = req.params.userId;
  let body = req.body;
  let files = req.files;

  let { fname, lname, email, profileImage, phone, password, address, ...rest } =
    body;

  if (Object.keys(body).length == 0 && files === undefined) {
    return res.status(400).send({
      status: false,
      message: "for updation atleast one key value pair is required",
    });
  }

  if (Object.keys(rest).length > 0) {
    return res.status(400).send({
      status: false,
      message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
    });
  }
  const arr = [
    "fname",
    "lname",
    "email",
    "profileImage",
    "phone",
    "password",
    "address",
  ];
  for (field of arr) {
    if (Object.keys(body).includes(field)) {
      if (
        field === "profileImage" &&
        (files[0].fieldname !== "profileImage" ||
          files === undefined ||
          files.length === 0)
      ) {
        return res
          .status(400)
          .send({
            status: false,
            message: "required profileImage as key and file as value",
          });
      }
      if (body[field].trim() === "") {
        return res
          .status(400)
          .send({ status: false, message: `required value of the ${field}` });
      }
    }
  }

  if (fname) {
    if (!isValidString(fname)) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter The Valid fname" });
    }
    if (!/^[A-Z a-z]+$/.test(fname.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "value of fname must be in letters" });
    }
    if (fname.trim().length === 1) {
      return res.status(400).send({
        status: false,
        message: "value of fname must contain more then 1 letter",
      });
    }
  }

  if (lname) {
    if (!isValidString(lname)) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter The Valid Lname" });
    }
    if (!/^[A-Z a-z]+$/.test(lname.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "value of fname must be in letters" });
    }
    if (lname.trim().length === 1) {
      return res.status(400).send({
        status: false,
        message: "value of lname must contain more then 1 letter",
      });
    }
  }

  if (email) {
    if (!isValidString(email)) {
      return res
        .status(400)
        .send({ status: false, message: "email must be in string format" });
    }
    if (!isValidEmail(email.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter The Valid email" });
    }
  }

  if (phone) {
    if (!isValidString(phone)) {
      return res.status(400).send({
        status: false,
        message: "phone number must be in string format",
      });
    }
    if (!isValidPhn(phone.trim())) {
      return res.status(400).send({
        status: false,
        message: "Please Enter The Valid Phone number  ",
      });
    }
  }

  if (password) {
    if (!isValidString(password)) {
      return res
        .status(400)
        .send({ status: false, message: "password must be in string format" });
    }
    if (!isValidPass(password.trim())) {
      return res.status(400).send({
        status: false,
        message:
          "password should contain at least (1 lowercase, uppercase ,numeric alphabetical character and at least one special character and also The string must be  between 8 characters to 16 characters)",
      });
    }
    const encryptPassword = await bcrypt.hash(password.trim(), 5);
    body.password = encryptPassword;
  }

  let obj = { fname, lname, email, phone, password };

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

    obj.profileImage = uploadedFileURL;
  }

  if (address) {
    address = JSON.parse(address);
    let { shipping, billing } = address;
    let arr = [shipping, billing];
    for (field of arr) {
      if (field) {
        let { street, city, pincode } = field;
        let arr = ["street", "city", "pincode"];
        for (key of arr) {
          if (field[key] === "") {
            return res
              .status(400)
              .send({ status: false, message: `required value of ${key}` });
          }
        }
        if (street) {
          if (!isValidString(street)) {
            return res.status(400).send({
              status: false,
              message: "Street value must in string format",
            });
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
            return res.status(400).send({
              status: false,
              message: "city value must in string format",
            });
          }
          if (field == shipping) {
            obj["address.shipping.city"] = field.city;
          }
          if (field == billing) {
            obj["address.billing.city"] = field.city;
          }
        }
        if (pincode) {
          if (typeof pincode === "string") {
            if (!isValidPincode(pincode.trim())) {
              return res.status(400).send({
                status: false,
                message: "pincode must be 6 digit number",
              });
            }
          }
          if (typeof pincode === "number") {
            if (!isValidPincode(pincode)) {
              return res.status(400).send({
                status: false,
                message: "pincode must be 6 digit number",
              });
            }
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
        .send({ status: false, message: `${field} is already exists` });
    }
  }

  let updation = await userModel.findByIdAndUpdate({ _id: userid }, obj, {
    new: true,
  });

  return res
    .status(200)
    .send({ status: true, message: "User profile updated", Data: updation });
};

module.exports = { createUser, login, getUser, userUpdate };
