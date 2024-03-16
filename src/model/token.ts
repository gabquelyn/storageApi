import { Schema, model } from "mongoose";
const tokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export default model("Token", tokenSchema);
