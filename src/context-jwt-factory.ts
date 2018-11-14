import * as jwt from './jwt'
import {IJwtContext, IJwtOptions} from './types'

const DEFAULT_EXPIRES_IN = 3600
const DEFAULT_REFRESH_EXPIRES_IN = '14d'

export type accessToken = string

export class NoJwtKeyError extends Error {
  constructor() {
    super('No jwt key')
  }
  // nothing
}



export interface IJwtContext {
  sign: (payload: object | string, expiresIn?: number | string) => Promise<accessToken>
  verify: (accessToken: accessToken) => Promise<object | string>
  refresh: (
    accessToken: string,
    refreshAccessToken: string,
    expiresIn?: number | string,
  ) => Promise<accessToken>
}

export default function contextJwtFactory(
  options: IJwtOptions = {},
  noJwtKeyError?: any,
): IJwtContext {
  const {
    signOptions,
    verifyOptions,
    key,
    expiresIn: defaultExpiresIn = DEFAULT_EXPIRES_IN,
    refreshExpiresIn: defaultRefreshExpiresIn = DEFAULT_REFRESH_EXPIRES_IN,
  } = options

  return {
    sign: (payload: object | string, expiresIn?: number | string): Promise<accessToken> => {
      if(!key){
        throw new NoJwtKeyError()
      }
      const myExpiresIn: number | string = expiresIn || defaultExpiresIn
      return jwt.sign(payload, key, {...signOptions, expiresIn: myExpiresIn})
    },

    verify: (accessToken: accessToken): Promise<object | string> => {
      if(!key){
        if(noJwtKeyError){
          throw new noJwtKeyError()
        }
        throw new NoJwtKeyError()
      }
      return jwt.verify(accessToken, key, verifyOptions)
    },

    refresh: (
      accessToken: string,
      refreshAccessToken: string,
      expiresIn?: number | string,
    ): Promise<accessToken> => {
      if(!key){
        if(noJwtKeyError){
          throw new noJwtKeyError()
        }
        throw new NoJwtKeyError()
      }
      const myExpiresIn: number | string = expiresIn || defaultRefreshExpiresIn
      return jwt.refresh(
        accessToken,
        refreshAccessToken,
        key,
        {...signOptions, expiresIn: myExpiresIn},
        verifyOptions,
      )
    },
  }
}
