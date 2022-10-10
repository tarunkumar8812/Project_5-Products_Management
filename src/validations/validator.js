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

module.exports = {
  isValidString,
  isValidEmail,
  isValidUrl,
  isValidPhn,
  isValidPass,
  isValidPincode,
};
