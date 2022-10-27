const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../AWS/aws");


const { validFName, validLName, validEmail, validPhone, validPassword,
  validAddress, validPW_4_Login, validProfileImage, validRest, V_address, V_Sub_address, V_street, V_city, V_pincode } = require("../validations/validUser")


async function createUser(req, res) {
  try {
    let data = req.body;
    let files = req.files

    // ------------------ Validation part ----------------
    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "please fill data in body" })

    let errors = []

    const requiredFields = ["fname", "lname", "email", "phone", "password", "address"];
    //-------- cheking mandatory fields --------
    for (field of requiredFields) {
      if (!Object.keys(data).includes(field)) { errors.push(field) }
    }

    if (files.length == 0) { errors.push("profileImage") }

    if (errors.length > 0) { return res.status(400).send({ status: false, message: `( ${errors} ) is/are mandatory` }); }

    data.address = JSON.parse(data.address);

    let { fname, lname, email, profileImage, phone, password, address, ...rest } = data

    //-----------all validations for fileds -----------
    validFName(fname, errors)
    validLName(lname, errors)
    validEmail(email, errors)
    validPassword(password, errors)
    validPhone(phone, errors)
    validAddress(address, errors)
    validRest(rest, errors)
    validProfileImage(files, errors)

    if (errors.length > 0) { return res.status(400).send({ status: false, message: `( ${errors} )` }); }

    //  ------- checking uniqueness of phone no. -------
    let phone_in_DB = await userModel.findOne({ phone })
    if (phone_in_DB) return res.status(409).send({ status: false, message: "Phone no. is already registered" })

    //  ---------checking uniqueness of email ---------
    let email_in_DB = await userModel.findOne({ email })
    if (email_in_DB) return res.status(409).send({ status: false, message: "Email is already registered" })

    // ------------- hashing the password ----------------
    data.password = await bcrypt.hash(password.trim(), 5);

    // --------------- using AWS to Store images ---------------
    data.profileImage = await uploadFile(files[0]);

    // --------------- creating user data ----------------
    let createUser = await userModel.create(data);

    return res.status(201).send({ status: true, data: createUser });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}


// // --------------------------------------- Login API --------------------------------------

const login = async function (req, res) {
  try {
    const credentials = req.body
    let { email, password, ...rest } = credentials;

    // ---------------- Applying Validation ------------

    if (Object.keys(credentials).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });

    let errors = []

    const requiredFields = ["email", "password"];
    //-------- cheking mandatory fields --------
    for (field of requiredFields) {
      if (!Object.keys(credentials).includes(field)) { errors.push(field) }
    }

    if (errors.length > 0) { return res.status(400).send({ status: false, message: ` ( ${errors} ) is/are mandatory` }); }

    validEmail(email, errors)

    validPW_4_Login(password, errors)

    validRest(rest, errors)

    if (errors.length > 0) { return res.status(400).send({ status: false, message: ` ( ${errors} )` }); }

    // --------- checking creadentials in DB -------------
    let user_in_DB = await userModel.findOne({ email: email });

    if (!user_in_DB) return res.status(401).send({ status: false, message: "invalid credentials (email or the password is incorrect)", });

    bcrypt.compare(password.trim(), user_in_DB.password, function (err, result) {
      if (result !== true) {
        return res.status(401).send({ success: false, message: "incorrect password" });
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

        let data = { token: token, userId: user_in_DB._id.toString(), };

        return res.status(200).send({ status: true, message: "User login successfull", data: data, });
      }
    });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};


// // ------------------------------------- get User API ------------------------------------

const getUser = async function (req, res) {
  try {
    const userId = req.params.userId;

    const getUser = await userModel.findById(userId);

    if (!getUser) return res.status(404).send({ status: false, message: "user not exist" });

    return res.status(200).send({ status: true, message: "success", data: getUser, });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};


// ------------------------------------ update User API -----------------------------------

const userUpdate = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    let files = req.files;
    let toUpdate = {}

    let errors = []

    let { fname, lname, email, phone, password, profileImage, address, ...rest } = data;

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "please fill atleast one data in body to update" })


    if (validFName(fname, errors) == true) { toUpdate['fname'] = fname }

    if (validLName(lname, errors) == true) { toUpdate['lname'] = lname }

    if (validPassword(password, errors) == true) {
      toUpdate['password'] = await bcrypt.hash(password.trim(), 5);
    }

    if (V_address(address, errors) == true) {
      address = JSON.parse(address);

      let { shipping, billing } = address;

      let subAdd = shipping

      let temp = "shipping"

      for (let i = 0; i < 2; i++) {

        if (V_Sub_address(subAdd, errors, temp) == true) {

          let { street, city, pincode } = subAdd

          if (V_street(street, errors, temp) != false) {
            toUpdate[`address.${temp}.street`] = street
          }
          if (V_city(city, errors, temp) != false) {
            toUpdate[`address.${temp}.city`] = city
          }
          if (V_pincode(pincode, errors, temp) != false) {
            toUpdate[`address.${temp}.pincode`] = pincode
          }

          subAdd = billing, temp = "billing"
        }
      }
    }

    //  ------- checking uniqueness of phone no. -------
    if (validPhone(phone, errors) == true) {
      let phone_in_DB = await userModel.findOne({ phone })
      if (phone_in_DB) return res.status(409).send({ status: false, message: "Phone no. is already registered" })

      toUpdate['phone'] = phone
    }

    //  ---------checking uniqueness of email ---------
    if (validEmail(email, errors) == true) {
      let email_in_DB = await userModel.findOne({ email })
      if (email_in_DB) return res.status(409).send({ status: false, message: "Email is already registered" })

      toUpdate['lname'] = lname
    }

    // ------------- using AWS to Store images -------------
    if (validProfileImage(files, errors) == true) {
      toUpdate['profileImage'] = await uploadFile(files[0]);
    }

    validRest(rest, errors)

    // --------------- checking errors if any ---------------
    if (errors.length > 0) { return res.status(400).send({ status: false, message: ` ( ${errors} ) ` }); }

    // --------------- updating user Prifile ---------------
    let updatedData = await userModel.findByIdAndUpdate(userId, toUpdate, { new: true, });

    // ---------- sending updated data in response ----------
    return res.status(200).send({ status: true, Data: updatedData });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

module.exports = { createUser, login, getUser, userUpdate };
