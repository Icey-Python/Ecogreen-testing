import { Logger } from 'borgen'
import { Config } from '../lib/config.js'
import africastalking from 'africastalking'
// Set your app credentials
const credentials = {
  apiKey: Config.AT_KEY,
  username: Config.AT_USERNAME,
}

// Initialize the SDK
const AfricasTalking = africastalking(credentials)


// @desc Buy airtime
// @route POST /api/v1/quickAction/airtime
export const buyAirtime = async (req, res) => {
  try {
    const { phone, amount } = req.body
    const airtime = AfricasTalking.AIRTIME

    const options = {
      maxNumRetry: 3,
      recipients: [
        {
          phoneNumber: phone,
          currencyCode: 'KES',
          amount: amount,
        },
      ],
    }

    let response = await airtime.send(options)

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Airtime purchase successful',
      data: response,
    })
  } catch (err) {
    Logger.error('Buy Airtime Error:', err.message)

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred during airtime purchase',
      error: err.message,
    })
  }
}


// @desc Send SMS
// @route POST /api/v1/payments/sms
export const sendSMS = async (req, res) => {
  try {
    const { phone, message } = req.body

    let response = axios.post(
      'https://sms.textsms.co.ke/api/services/sendsms',
      {
        apikey: '123456789',
        partnerID: '123',
        message: message,
        shortcode: 'SENDERID',
        mobile: phone, // 2547xxxxxx
      },
    )

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Airtime purchase successful',
      data: response,
    })
  } catch (err) {
    Logger.error('Buy Bundles Error:', err.message)

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred during bundles purchase',
      error: err.message,
    })
  }
}
