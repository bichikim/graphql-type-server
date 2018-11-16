import dotEnv from 'dotEnv'
import {GraphqlServer} from '../src'

dotEnv.config()

const server = new GraphqlServer()
server.start({
  root: 'build',
  mongoDB: {
    url: process.env.MONGODB_URL
  },
  jwt: {
    key: process.env.JWT_KEY
  }
}).then(() => {
  console.log('server is running')
})