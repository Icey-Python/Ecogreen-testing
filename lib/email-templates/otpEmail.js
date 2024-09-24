export const otpEmail= (otpCode)=>{
return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #4CAF50;
            color: white;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            color: #333;
        }
        .otp-code {
            display: inline-block;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            padding: 10px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>OTP Code</h1>
    </div>

    <div class="content">
        <p>Hi,</p>
        <p>Someone requested to sign into your acoount, enter this code to verify if it you who is signing in </p>

        <div class="otp-code">
            ${otpCode}
        </div>

        <p>If Its not you who is trying to sign in, please reset your password ASAP.</p>
    </div>

    <div class="footer">
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>&copy; 2024 Ecogreen. All rights reserved.</p>
    </div>
</div>

</body>
</html>
`
}

export const resetEmail = (otpCode) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .header {
            background-color: #4CAF50;
            padding: 10px;
            color: white;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            color: #333;
        }
        .otp-code {
            display: inline-block;
            background-color: #f9f9f9;
            padding: 15px;
            font-size: 28px;
            letter-spacing: 10px;
            font-weight: bold;
            color: #333;
            border: 2px dashed #4CAF50;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            padding: 10px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>

    <div class="content">
        <p>Hi,</p>
        <p>You requested to reset your password. Please use the OTP code below to proceed with resetting your password:</p>

        <div class="otp-code">
            ${otpCode}
        </div>

        <p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
    </div>

    <div class="footer">
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>&copy; 2024 Ecogreen. All rights reserved.</p>
    </div>
</div>

</body>
</html>
  `
}
