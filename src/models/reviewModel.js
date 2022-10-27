const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const reviewSchema = new mongoose.Schema(
    {
        productId: {
            type: ObjectId,
            ref: "product",
            required: true,
            trim: true
        },
        userId: {
            type: ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        likeStatus: {
            type: String,
            default: null,
            trim: true
        },
        ratings: {
            type: Number,
            default: null
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Review", reviewSchema);
