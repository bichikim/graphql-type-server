/* eslint-disable class-methods-use-this */
import {plainToClass} from 'class-transformer'
import {IsEmail, Validate} from 'class-validator'
import {Model, models} from 'mongoose'
import {IJwtContext} from '../src/types'
import {codes, WebApiError} from 'src/ApiServer/errors'
import {IsPassword} from 'src/ApiServer/vaildators'
import {IUser} from 'src/mongoose-schemas/users'
import {
  Arg,
  Args,
  ArgsType,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import {UserObject} from './users'

@ArgsType()
export class SignInArgs {
  @Field()
  @IsEmail()
  email: string
  @Field()
  @Validate(IsPassword)
  password: string
}

@ArgsType()
export class SignUpArgs extends SignInArgs {}

@ArgsType()
export class ChangePasswordArgs {
  @Field()
  @IsEmail()
  email: string
  @Field()
  @Validate(IsPassword)
  currentPassword: string
  @Field()
  @Validate(IsPassword)
  nextPassword: string
}

@ObjectType()
export class RefreshAccessTokenObject {
  @Field()
  accessToken?: string
}

@ObjectType()
export class AuthObject extends UserObject {
  // eslint-disable-next-line class-methods-use-this
  @Field(() => String)
  accessToken(@Root() root: any, @Ctx('jwt') jwt: IJwtContext): Promise<string> {
    const {email, roles} = root
    return jwt.sign({email, roles})
  }
  // eslint-disable-next-line class-methods-use-this
  @Field(() => String)
  refreshAccessToken(@Root() root: any, @Ctx('jwt') jwt: IJwtContext) {
    const {email, roles} = root
    return jwt.sign({email, roles})
  }
}

@Resolver()
export default class Auth {
  readonly Users: Model<IUser> = models.Users

  @Query(() => AuthObject, {description: 'sign-in to get access token'})
  async signIn(@Args() {email, password}: SignInArgs) {
    const user = await this.Users.findOne({email})

    if(!user){
      throw new WebApiError(codes.users.noUser)
    }

    if(!(await user.verifyPassword(password))){
      throw new WebApiError(codes.auth.incorrectPassword)
    }

    return plainToClass(AuthObject, {
      email: user.email,
      roles: user.roles,
      time: user.time,
    })
  }

  @Mutation(() => AuthObject)
  async signUp(@Args() {email, password}: SignUpArgs) {
    const isUser = await this.Users.findOne({email})

    if(isUser){
      throw new WebApiError(codes.auth.takenEmail)
    }

    const user = await this.Users.create({email, password})

    return plainToClass(AuthObject, {
      email: user.email,
      roles: user.roles,
      time: user.time,
    })
  }

  @Mutation(() => UserObject)
  async changePassword(@Args() {email, currentPassword, nextPassword}: ChangePasswordArgs) {
    const user = await this.Users.findOne({email})
    if(!user){
      throw new WebApiError(codes.users.noUser)
    }
    if(!(await user.verifyPassword(currentPassword))){
      throw new WebApiError(codes.auth.incorrectPassword)
    }
    const modifiedUser = await user.update({password: nextPassword})
    return plainToClass(UserObject, {
      email: modifiedUser.email,
      roles: modifiedUser.roles,
      time: modifiedUser.time,
    })
  }

  @Query(() => RefreshAccessTokenObject)
  async refreshToken(
    @Arg('accessToken') accessToken: string,
    @Arg('refreshAccessToken') refreshAccessToken: string,
    @Ctx('jwt') jwt: IJwtContext,
  ) {
    return plainToClass(RefreshAccessTokenObject, {
      accessToken: await jwt.refresh(accessToken, refreshAccessToken),
    })
  }
}
