export const Config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JW_SECRET,
  RS_MAIL_KEY: process.env.RS_MAIL_KEY,
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
  LNM_PASSKEY: process.env.LNM_PASSKEY || '' ,
  AT_KEY: process.env.AT_KEY || 'myApiKey',
  AT_USERNAME: process.env.AT_USERNAME || 'myAppUsername',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY
};
