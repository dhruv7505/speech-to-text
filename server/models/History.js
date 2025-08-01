import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // assuming you have a User model
        required: true,
    },
    type: {
        type: String,
        enum: ["Upload", "Live"],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("History", HistorySchema);
