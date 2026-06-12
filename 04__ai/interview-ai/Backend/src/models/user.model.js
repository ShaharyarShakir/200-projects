import {Schema, model} from "mongoose"
import * as mongoose from 'mongoose'


const userSchema = new Schema({
username: {
    type: String,
    unique: [true, 'username already exits'],
    required: true
},
email: {
    type: String,
    unique: [true, "email address already exits"],
    required: true
},
password: {
    type: String,
    required: true
}})

const User = model('User', userSchema)

export default User