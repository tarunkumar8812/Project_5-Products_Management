const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer")
const router = require("./router/router");
const moment = require("moment")
require("dotenv").config()
const app = express();
app.use(express.json());
app.use(multer().any())
app.use(express.urlencoded({ extended: true }));



mongoose.connect(process.env.MONGO_URL || "mongodb+srv://Firoz_Shaik_:XaFPzUPEGu5fK1KS@cluster0.dshhzz6.mongodb.group23Database-project5-DB", {
  useNewUrlParser: true
}
)
  .then(() => console.log("MongoDB is connected"))
  .catch((err) => console.log(err.message));


app.use(
  function (req, res, next) {
    let time = moment().format("DD/MM/YYYY hh:mm:ss a")
    console.log(`time : ${time} , url : ${req.url} `);
    next();
  }
);

app.use("/", router);

app.use("/*", (req, res) => res.status(404).send({ status: false, message: "invalid Path url" }));


app.listen(process.env.PORT || 3000, function () {
  console.log("Express app running on port " + (process.env.PORT || 3000))
})