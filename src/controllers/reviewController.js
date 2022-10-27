const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const { V_userIdInParam, V_productIdInBody, V_likeStatus, V_ratings, validRest } = require("../validations/utils");



//   ---------------------------------- create review API -------------------------------

async function createReview(req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { productId, likeStatus, ratings, ...rest } = data;


        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please fill data in body" });


        if (!ratings && !likeStatus) {
            return res.status(201).send({ status: false, message: "fill either likeStatus or ratings" });
        }

        let errors = []

        V_userIdInParam(userId, errors)

        V_productIdInBody(productId, errors)

        V_likeStatus(likeStatus, errors)

        V_ratings(ratings, errors)

        validRest(rest, errors)

        if (errors.length > 0) return res.status(400).send({ status: false, message: ` ( ${errors} )` });

        // ------------ checking product in DB -------------
        let product_in_DB = await productModel.findOne({ productId })

        if (!product_in_DB) return res.status(404).send({ status: false, message: "product not found" });

        // ------------ checking review in DB -------------
        let review_in_DB = await reviewModel.findOne({ productId })

        if (!review_in_DB) {

            data["userId"] = userId
            let reviewStatus = await reviewModel.create(data)

            return res.status(201).send({ status: true, message: "Success", data: reviewStatus });
        }

        let toUpdate = {}
        if (ratings) { toUpdate["ratings"] = ratings }

        if (likeStatus) { toUpdate["likeStatus"] = likeStatus.trim() }

        if (likeStatus && likeStatus == review_in_DB.likeStatus) {
            toUpdate["likeStatus"] = null
        }

        let reviewStatus = await reviewModel.findOneAndUpdate({ productId }, toUpdate, { new: true })

        return res.status(201).send({ status: true, message: "Success", data: reviewStatus });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = { createReview };
