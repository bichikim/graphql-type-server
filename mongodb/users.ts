/* eslint-disable consistent-this */
import bcrypt from 'bcrypt'
import {Document, Schema} from 'mongoose'
const PASSWORD = 'password'
const SALT_WORK_FACTOR = 7
const user = new Schema({
  email: {type: String, required: true, unique: true},
  [PASSWORD]: {type: String, required: true},
  roles: {type: [String], required: true, default: []},
  time: {type: Number, required: true, default: Date.now},
  suspend: {type: Boolean, required: true, default: false},
  verified: {type: Boolean, required: true, default: true},
})

export interface IUser extends Document {
  password: string
  email: string
  roles: string[]
  time: number
  suspend: boolean
  verifyPassword: (password: string) => Promise<boolean>
}

export const hash = async (password: string): Promise<string> => {
  let salt
  try{
    salt = await bcrypt.genSalt(SALT_WORK_FACTOR)
  }catch(e){
    throw e
  }
  let hash
  try{
    hash = await bcrypt.hash(password, salt)
  }catch(e){
    throw e
  }
  return hash
}

/**
 * bcrypt password to save
 */
user.pre<IUser>('save', async function hook(this: IUser, next): Promise<void> {
  if(!this.isModified(PASSWORD)){
    return next()
  }

  this.password = await hash(this.password)

  next()
})

/**
 * add password a verify function
 */
user.method('verifyPassword', function method(this: IUser, password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
})

// noinspection JSUnusedGlobalSymbols
export default user
