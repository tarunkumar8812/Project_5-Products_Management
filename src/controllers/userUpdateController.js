const userModel = require('../models/userModel')
const mongoose = require('mongoose')
const Objectid = mongoose.Types.Objectid
const {
    isValidString, isValidEmail, isValidUrl, isValidPhn, isValidPass, isValidPincode } = require("../validations/validator");




//   PUT /user/:userId/profile

const userUpdate = async function (req, res) {
    
    let userid = req.params.userId
    let body = req.body

    if(!Objectid.isValid(userid)){
        return res.status(400).send({ status: false, msg: "Please Enter Valid userID" })
    }

    if (Object.keys(body).length == 0) {
        return res.status(400).send({ status: false, msg: "Please Enter Valid Details" })
    }

    let { fname, lname, email, profileImage, phone, password, address } = body

    if (fname) {
        if (!isValidString(fname)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid fname " }) }
    }

    if (lname) {
        if (!isValidString(lname)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid Lname " }) }
    }

    if (email) {
        if (!isValidString(email)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid email" }) }
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid email  " }) }
    }
    if (profileImage) {
        if (!isValidString(profileImage)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid email  " }) }
        if (!isValidUrl(profileImage)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid email" }) }
    }

    if (phone) {
        if (!isValidString(phone)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid phone number  " }) }
        if (!isValidPhn(phone)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid Phone number  " }) }
    }

    if (password) {
        if (!isValidString(password)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid password" }) }
        if (!isValidPass) { return res.status(400).send({ status: false, msg: "Please Enter The Valid password  " }) }
    }
    password = bcrypt.hash(password, 10)

    if (address) {
        let { shipping, billing } = address
        let { street, city, pincode } = { shipping, billing }
        if (shipping || billing) {
            if (street) {
                if (!isValidString(street)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid Street  " })}
            }
            if (city) {
                if (!isValidString(city)) { return res.status(400).send({ status: false, msg: "Please Enter The Valid city " })}
            }
            if(pincode){
                if (!isValidPincode(pincode)){ return res.status(400).send({ status: false, msg: "Please Enter The Valid pincode" })}
            }

        }
    }


    let obj = {fname, lname, email, profileImage, phone, password, address}
    
    let updation = await userModel.updateOne({_id : userid},obj,{new:true})
    
    return res.status(200).send({ status: true, Data:updation})

}