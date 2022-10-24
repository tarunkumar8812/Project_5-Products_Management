// ------------- validation of user First Name -------------

const validFName = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ firstName can not be empty }") }
    let regex = /^([a-zA-Z]){2,15}$/
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push(`{ Invalid FirstName:- available characters are ( a-zA-Z ) with minimum 2 and maximum 15 characters. }`) }
    return true
}
// ------------- validation of user First Name -------------

const validLName = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ LastName can not be empty }") }
    let regex = /^([a-zA-Z]){2,15}$/
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push(`{ Invalid LastName:- available characters are ( a-zA-Z ) with minimum 2 and maximum 15 characters }`) }
    return true

}

// ------------- validation of email -------------

const validEmail = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Email can not be empty }") }
    let regex1 = /^[a-zA-Z0-9.]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}/;
    let validRegex1 = regex1.test(value.trim())
    if (validRegex1 == false) { return e.push(`{ Invalid Email, ex:- ( abc123@gmail.com ) }`) }

    let regex2 = /^(?=.*[A-Za-z])/
    let validRegex2 = regex2.test(value.trim()[0])
    if (validRegex2 == false) { return e.push(`{ First letter of Email must be alphabet }`) }
    return true

}


// ------------- validation of phone no. -------------

const validPhone = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Phone can not be empty }") }
    let regex = /^[6-9]{1}[0-9]{9}$/
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push(`{ Phone no. must be indian (ex:- 98XX45XX33 ) containg 10 digits.}`) }
    return true

}



// ------------- validation of password -------------

const validPassword = function (value, e) {
    if (value == undefined) { return }
    if (value.trim() == "") { return e.push("{ Password can not be empty }") }
    if (value.trim().length < 8 || value.trim().length > 15) { return e.push("{ Password must have minimum 8 and maximum 15 chacracters }") }
    let regex = /^(?=.*[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#!@$%^&*()+=]).{8,15}$/
    let validRegex = regex.test(value.trim())
    if (validRegex == false) { return e.push("{ Use strong password, must contain ( a-z A-Z 0-9 [!@#\$%\^&\*] ) }") }
    return true

}


// ------------- validation of address for register the user-------------

const validAddress = function (value, e) {
    if (typeof value !== "object") { return e.push("{ Address must be object format }") }
    if (Array.isArray(value)) { return e.push("{ Address must be object format }") }
    if (Object.keys(value).length == 0) { return e.push("{ Address can not be empty, have to fill  ( Shipping Address , Billing Address ) } ") }

    let { shipping, billing, ...rest1 } = value

    if (Object.keys(rest1).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest1)} ) data }`) }



    // ------- validation function of shipping and billing address -------
    let subAdd = "Shipping"
    const valid_Sub_Add = function (val) {
        if (Object.keys(val).length == 0) { return e.push(`{ ${subAdd} Address can not be empty }`) }
        if (typeof val !== "object") { return e.push(`{ ${subAdd} Address must be object format } `) }
        if (Array.isArray(val)) { return e.push(`{ ${subAdd} Address must be object format } `) }

        let { street, city, pincode, ...rest } = val
        if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) data } `) }


        //---------------------- Street -------

        if (street == undefined) { return e.push(`{ Street of ${subAdd} Address is mandatory }`) }
        if (typeof street != "string") { return e.push(`{ Street of ${subAdd} Address must be in string}`) }
        if (street.trim() == "") { return e.push(`{ Street of ${subAdd} Address can not be empty }`) }
        if (street.trim().length < 5) { return e.push(`{ Minimum 5 are required for street of ${subAdd} Address }`) }
        if (street.trim().length > 30) { return e.push(`{ maximum 30 chacracters are allowed for street of ${subAdd} Address }`) }

        let regex1 = /^([a-zA-Z 0-9 .,-/]){5,30}$/
        let validRegex1 = regex1.test(street.trim())
        if (validRegex1 == false) { return e.push(`{ Street of ${subAdd} Address in wrong format, available characters are ( A-Z a-z 0-9 /.,- ) }`) }



        //----------------------- City -------

        if (city == undefined) { return e.push(`{ City of ${subAdd} Address is mandatory }`) }
        if (typeof city != "string") { return e.push(`{ City of ${subAdd} Address must be in string}`) }
        if (city.trim() == "") { return e.push(`{ City of ${subAdd} Address can not be empty }`) }
        if (city.trim().length < 3) { return e.push(`{ Minimum 3 are required for City of ${subAdd} Address }`) }
        if (city.trim().length > 20) { return e.push(`{ maximum 20 chacracters are allowed for City of ${subAdd} Address }`) }

        let regex2 = /^([a-zA-Z .,]){3,20}$/
        let validRegex2 = regex2.test(city.trim())
        if (validRegex2 == false) { return e.push(`{ City of ${subAdd} Address in wrong format, available characters are ( A-Z a-z ., ) } `) }


        //--------------------- Pincode -------

        if (pincode == undefined) { return e.push(`{ Pincode of ${subAdd} Address is mandatory }`) }
        if (typeof pincode != "number") { return e.push(`{ Pincode of ${subAdd} Address must be in digits}`) }

        let regex = /^[0-9]{6}/
        let validRegex = regex.test(pincode)
        if (validRegex == false) { return e.push(`{ Pincode of ${subAdd} Address must be of 6 digits only }`) }

    }

    valid_Sub_Add(shipping)
    subAdd = "Billing"
    valid_Sub_Add(billing)
}



// _______ this is for login only ________________

const validPW_4_Login = function (value, e) {
    if (typeof value !== "string") { return e.push("{ Password must be string }") }
    if (value.trim() == "") { return e.push("{ Password can not be empty }") }
    if (value.trim().length < 8) { return e.push("{ Use strong password, minimum 8 chacracters are required }") }
    if (value.trim().length > 15) { return e.push("{ Too long password, maximum 15 chacracters are allowed }") }
}






// ------------- validation of Profile Image -------------

const validProfileImage = function (value, e) {
    if (value.length == 0) { return }
    let format = ["image/png", "image/jpg", "image/jpeg"]
    if (!format.includes(value[0].mimetype)) return e.push(`{ Only .png, .jpg and .jpeg format are allowed for profileImage ! }`)

    if (value[0].size > 2000000) { return e.push(`{ maximum size of image can be 2 MB }`) }
    return true
}

// ------------- validation of Rest unexpected Fields -------------
const validRest = function (rest, e) {
    if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) data }`) }
}


// ------------------------------ yaha se aage  update API ke liye hai ------------------------------

// ------------- validation of address for Update the user-------------

const V_address = function (address, e) {

    if (address == undefined) { return false }
    address = JSON.parse(address);
    if (typeof address !== "object") { return e.push("{ Address must be object format }") }
    if (Array.isArray(address)) { return e.push("{ Address must be object format }") }
    if (Object.keys(address).length == 0) { return e.push("{ Address can not be empty, have to fill  ( Shipping Address , Billing Address ) } ") }

    let { shipping, billing, ...rest1 } = address

    if (Object.keys(rest1).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest1)} ) in address }`) }

    return true
}

const V_Sub_address = function (subAdd, e, temp) {

    if (subAdd == undefined) { return false }
    if (Object.keys(subAdd).length == 0) { return e.push(`{ ${temp} Address can not be empty }`) }
    if (typeof subAdd !== "object") { return e.push(`{ ${temp} Address must be object format } `) }
    if (Array.isArray(subAdd)) { return e.push(`{ ${temp} Address must be object format } `) }

    let { street, city, pincode, ...rest } = subAdd
    if (Object.keys(rest).length > 0) { return e.push(`{ You can not fill these:-( ${Object.keys(rest)} ) in ${temp} Address } `) }

    return true
}



//---------------------- Street -------
const V_street = function (street, e, temp) {

    if (street == undefined) { return false }
    if (typeof street != "string") { return e.push(`{ Street of ${temp} Address must be in string}`) }
    if (street.trim() == "") { return e.push(`{ Street of ${temp} Address can not be empty }`) }
    if (street.trim().length < 5) { return e.push(`{ Minimum 5 characters are required for street of ${temp} Address }`) }
    if (street.trim().length > 30) { return e.push(`{ maximum 30 characters are allowed for street of ${temp} Address }`) }

    let regex1 = /^([a-zA-Z 0-9 .,-/]){5,30}$/
    let validRegex1 = regex1.test(street.trim())
    if (validRegex1 == false) { return e.push(`{ Street of ${temp} Address address is in wrong format, available characters are ( A-Z a-z 0-9 /.,- ) }`) }

    return street
}

//----------------------- City -------
const V_city = function (city, e, temp) {
    if (city == undefined) { return false }
    if (typeof city != "string") { return e.push(`{ City of ${temp} Address must be in string}`) }
    if (city.trim() == "") { return e.push(`{ City of ${temp} Address can not be empty }`) }
    if (city.trim().length < 3) { return e.push(`{ Minimum 3 are required for City of ${temp} Address }`) }
    if (city.trim().length > 20) { return e.push(`{ maximum 20 chacracters are allowed for City of ${temp} Address }`) }

    let regex2 = /^([a-zA-Z .,]){3,20}$/
    let validRegex2 = regex2.test(city.trim())
    if (validRegex2 == false) { return e.push(`{ City of ${temp} Address in wrong format, available characters are ( A-Z a-z ., ) } `) }
    return city


}

//--------------------- Pincode -------
const V_pincode = function (pincode, e, temp) {
    if (pincode == undefined) { return false }

    if (typeof pincode != "number") { return e.push(`{ Pincode of ${temp} Address must be in digits}`) }

    let regex = /^[0-9]{6}/
    let validRegex = regex.test(pincode)
    if (validRegex == false) { return e.push(`{ Pincode of ${temp} Address must be of 6 digits only }`) }
    return pincode
}

module.exports = { validFName, validLName, validPhone, validEmail, validPassword, validAddress, validPW_4_Login, validProfileImage, validRest, V_address, V_Sub_address, V_street, V_city, V_pincode }