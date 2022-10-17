function isValidString(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }
  return true;
}

function isValidEmail(value) {
  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(value);
}

function isValidUrl(value) {
  let urlRegex =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)*$/;
  return urlRegex.test(value);
}

function isValidPhn(value) {
  let phnRegex = /^([9876]{1})([0-9]{9})*$/;
  return phnRegex.test(value);
}

function isValidPass(value) {
  let passRegex =
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,15}$/;
  return passRegex.test(value);
}

function isValidPincode(value) {
  let pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(value);
}

function isValidPrice(value) {
  let priceRegex = /^(0|[1-9]\d*)(\.\d+)?$/;
  return priceRegex.test(value);
}

function isValidCurencyId(value) {
  
  if(value!=="INR"){
    return false
  }
  return true
}


function isValidCurencyFormat(value) {
  
  if(value.length==0 || value!=="₹"){
    return false
  }
  return true
}



// ------------- validation of email -------------

const validEmail = function (value) {
  if (value == undefined) { return "Email is required" }
  if (typeof value !== "string") { return "Email must be string" }
  if (value.trim() == "") { return "Email can not be empty" }

  let regex2 = /^[a-zA-Z0-9.]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}/;
  let validRegex2 = regex2.test(value.trim())
  if (validRegex2 == false) { return `Invalid Email, ex:- ( abc123@gmail.com )` }

  let regex1 = /^(?=.*[A-Za-z])/
  let validRegex1 = regex1.test(value.trim()[0])
  if (validRegex1 == false) { return `First letter of Email must be alphabet` }

  return true
}

const validPW_4_Login = function (value) {
  if (value == undefined) { return "Password is required" }
  if (typeof value !== "string") { return "Password must be string" }
  if (value.trim() == "") { return "Password can not be empty" }
  if (value.trim().length < 8) { return "Too short password, minimum 8 chacracters are required" }
  if (value.trim().length > 15) { return "Too long password, maximum 15 chacracters are allowed" }

  return true
}

module.exports = {
  isValidString,
  isValidEmail,
  isValidUrl,
  isValidPhn,
  isValidPass,
  isValidPincode,
  validEmail,
  validPW_4_Login,
  isValidPrice,
  isValidCurencyId,
  isValidCurencyFormat
};
