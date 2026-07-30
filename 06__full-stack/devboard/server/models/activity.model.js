import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
