const express = require("express");
const mongoose = require("mongoose");
const multer=require("multer")
const router = require("./router/router");
const app = express();
app.use(express.json());
app.use(multer().any())
app.use(express.urlencoded({ extended: true }));
mongoose
  .connect(
    "mongodb+srv://Firoz_Shaik_:XaFPzUPEGu5fK1KS@cluster0.dshhzz6.mongodb.net/group23Database-project5-DB",
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB is connected"))
  .catch((err) => console.log(err.message));

app.use("/", router);
app.use("/*", (req, res) => res.status(404).send({status: false, message:"invalid url"}));

app.listen(3000, () => {
  console.log("Express app is running on: " + 3000);
});
