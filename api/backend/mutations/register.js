import bcrypt from 'bcryptjs'
import log from 'chalk-console'
import raven from 'raven'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import {
  sendEmail,
} from 'api/email/mailer'

import staticConfig from 'lib/config'

const createSendEmail = async ({email, displayname,}) => {
  const config = await staticConfig()
  const token = jwt.sign({
    email,
  }, config.get('keypair.clientprivate'), {
    'expiresIn': '1d',
    'issuer':    config.get('domain'),
    'algorithm': 'HS256',
  })

  let link = `https://${config.get('domain')}/account/verify-email/${token}`

  if (process.env.NODE_ENV === 'development') {
    link = `http://${config.get('domain')}/account/verify-email/${token}`
  }

  const expires = moment().add(1, 'days').format('MMMM Do, HH:mm ZZ')

  const result = await sendEmail({
    'to':       email,
    'template': 'email-verification-initial',
    'locals':   {
      displayname,
      link,
      expires,
    },
  })

  return result
}

export default async (root, {displayname, email, password,}, {User, token,}) => {
  const config = await staticConfig()
  const salt = await bcrypt.genSalt(parseInt(config.get('saltrounds'), 10))
  const hash = await bcrypt.hash(password, salt)
  const newUser = await User.create({
    'password': hash,
    'username': displayname.toLowerCase(),
    displayname,
    email,
  })
  const savedUser = await newUser.save()

  createSendEmail(newUser)
  .catch((error) => {
    log.error(error.stack)
    raven.captureException(error)
  })

  return savedUser
}
