import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  filename: String,
});

export const ProductModel = mongoose.model("Product", productSchema);
