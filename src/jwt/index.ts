import jwt, {
  JsonWebTokenError,
  SignOptions,
  TokenExpiredError,
  VerifyErrors,
  VerifyOptions,
} from 'jsonwebtoken'
import {isEqual, omit} from 'lodash'
export {JsonWebTokenError, TokenExpiredError, SignOptions, VerifyOptions}
const JWT_DEFAULT_MEMBERS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']

export function sign(
  payload: object | string,
  secretOrPublicKey: string | Buffer,
  options?: SignOptions,
): Promise<string> {
  return new Promise<any>((resolve, reject) => {
    const callback = (err, encoded: string) => {
      if(err){
        reject(err)
        return
      }
      resolve(encoded)
    }
    if(options){
      jwt.sign(payload, secretOrPublicKey, options, callback)
      return
    }
    jwt.sign(payload, secretOrPublicKey, callback)
  })
}

export function verify<A = object | string>(
  token: string,
  secretOrPublicKey: string | Buffer,
  options?: VerifyOptions,
): Promise<A> {
  return new Promise<A>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, options, (err: VerifyErrors, decoded: object | string) => {
      if(err){
        reject(err)
        return
      }
      resolve(decoded as any)
    })
  })
}

export async function refresh<A = object | string>(
  token: string,
  refreshToken: string,
  secretOrPublicKey: string,
  signOptions?: SignOptions,
  verifyOptions?: VerifyOptions,
): Promise<string> {
  let refreshDecode: any
  let decode: any
  try{
    refreshDecode = await verify(refreshToken, secretOrPublicKey, verifyOptions)
    refreshDecode = omit(refreshDecode, JWT_DEFAULT_MEMBERS)
  }catch(e){
    throw e
  }

  try{
    decode = await verify(token, secretOrPublicKey, {...verifyOptions, ignoreExpiration: true})
    decode = omit(decode, JWT_DEFAULT_MEMBERS)
  }catch(e){
    throw e
  }
  if(!isEqual(refreshDecode, decode)){
    throw new Error('token is not same')
  }

  return sign(decode, secretOrPublicKey, signOptions)
}
