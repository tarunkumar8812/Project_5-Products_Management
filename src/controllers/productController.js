const productModel = require("../models/productModel");
const {
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
  } = require("../validations/validator"); 


const createProduct = async function (req, res){
try{
    const data = req.body

    console.log(data)

    const {title,description,price,currencyId,currencyFormat,isFreeShipping,productImage,style,availableSizes,installments, ...rest} = data

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" })

    if (Object.keys(rest).length > 0) {
      return res.status(400).send({
        status: false,
        message: `You can not fill these:- ( ${Object.keys(rest)} )field`,
      });
    }

    
const requiredFields = ["title","description","price","currencyId","currencyFormat","productImage","availableSizes"]

  for(field of requiredFields){

    if(!Object.keys(data).includes(field)){
        return res
        .status(400)
        .send({ status: false, msg: `${field} is required`});
    
    }
  }

  if (title) {
    if (!isValidString(title)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter The Valid title " });
    }
  }
  if (description) {
    if (!isValidString(description)) {
      return res
        .status(400)
        .send({ status: false, msg: "description must be in string " });
    }
  }

  if (price) {
    if (!isValidPrice(price)) {
      return res
        .status(400)
        .send({ status: false, msg: "price must be in number " });
    }
  }

  if (currencyId) {
    if (!isValidCurencyId(currencyId)) {
      return res
        .status(400)
        .send({ status: false, msg: "currencyId must be in INR " });
    }
  }

  if(currencyFormat == ""){
    return res
    .status(400)
    .send({ status: false, msg: "CurencyFormat should not be empty " })
}
  if (currencyFormat) {
   
    if (!isValidCurencyFormat(currencyFormat.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: "CurencyFormat must be in ₹ " });
    }
  }


    const saveProduct = await productModel.create(data)

    return res.status(201).send({status: true, data: saveProduct })


} catch(err){
    return res.status(500).send({ status: false, message: err.message });
  }


} 

module.exports = {createProduct}