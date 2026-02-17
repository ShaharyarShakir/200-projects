import mongoose from 'mongoose'
import argon2 from 'argon2'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    try {
        const hash = await argon2.hash(this.password)
        this.password = hash
        next()
    } catch (err) {
        next(err)
    }
})
userSchema.methods.comparePassword = async function (userPassword) {
    try {
        return await argon2.verify(this.password, userPassword)
    } catch (err) {
        throw new Error(err)
    }
}

userSchema.index({ username: "text" })

const User = mongoose.model('User', userSchema)
export default User
