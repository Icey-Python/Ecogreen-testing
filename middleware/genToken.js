import axios from 'axios'
import { Config } from '../lib/config.js'

export const generateToken = async (
  req,
  res,
  next,
) => {
  const URL =
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

  const auth = Buffer.from(
    `${Config.MPESA_CONSUMER_KEY}:${Config.MPESA_CONSUMER_SECRET}`,
  ).toString('base64')

  try {
    const response = await axios(URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })
    res.locals.token = response.data.access_token
    next()
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error.message}`)
  }
}
