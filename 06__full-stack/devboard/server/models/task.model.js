import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      default: "TODO"
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
