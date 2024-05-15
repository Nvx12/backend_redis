import mongoose from "mongoose";


const Schema = mongoose.Schema;

export const CountrySchema = new Schema({
    name: {
        type: String,
        required: "enter country name",
    },
    capital: {
        type: String,
        required: "enter country capital name",
    },
    remarks: {
        type: String,
        required: "enter country's remarks",
    },
    creation_date: {
        type: Date,
        default: Date.now
    }
});