import mogoose from "mongoose"

const refreshTokenSchema = new mogoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mogoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const RefreshToken = mogoose.model("RefreshToken", refreshTokenSchema)
export default RefreshToken
