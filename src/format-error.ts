import {TokenExpiredError} from './jwt'
import {ArgumentValidationError, ForbiddenError, UnauthorizedError} from 'type-graphql'
import {NoJwtKeyError} from './context-jwt-factory'
import {IFormattedErrorObject, IErrorOptions, IApolloError, IErrorCodeItem} from './types'

function formatError(
  error: IApolloError,
  codeItem?: IErrorCodeItem,
  additionalInfo: {[key: string]: any} = {},
): IFormattedErrorObject {
  const myCode = error.extensions && error.extensions.code ? error.extensions.code : ''
  return {
    message: codeItem ? codeItem.message : error.message,
    locations: error.locations,
    path: error.path,
    code: codeItem ? codeItem.code : myCode,
    ...additionalInfo,
  }
}

export default function formatErrorFactory(options: IErrorOptions = {}) {
  const {tokenExpired, unauthorized, noJwtKey, forbidden, failArgumentValidation} = options
  return (error: IApolloError) => {
    if(
      error.originalError instanceof TokenExpiredError &&
      error.originalError.name === 'TokenExpiredError'
    ){
      return formatError(error, tokenExpired)
    }
    if(error.originalError instanceof NoJwtKeyError){
      return formatError(error, noJwtKey)
    }
    if(error.originalError instanceof UnauthorizedError){
      return formatError(error, unauthorized)
    }
    if(error.originalError instanceof ForbiddenError){
      return formatError(error, forbidden)
    }
    if(error.originalError instanceof ArgumentValidationError){
      return formatError(error, failArgumentValidation, {
        validationErrors: error.extensions.exception.validationErrors,
      })
    }
    return formatError(error)
  }
}
