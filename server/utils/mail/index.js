const mailer = require('nodemailer');
const { welcome } = require('./welcome_template');
const { purchase } = require('./purchase_template');
const { resetPass } = require('./resetpass_template');
require('dotenv').config();

const getEmailData = (to, name, token, type, actionData) => {
  let data = null;

  switch (type) {
    case 'welcome':
      data = {
        from: 'Waves <gokutra4@gmail.com>',
        to,
        subject: `Welcome to waves ${name}`,
        html: welcome()
      };
      break;
    case 'purchase':
      data = {
        from: 'Waves <gokutra4@gmail.com>',
        to,
        subject: `Thanks for shopping with us ${name}`,
        html: purchase(actionData)
      };
      break;
    case 'reset_password':
      data = {
        from: 'Waves <gokutra4@gmail.com>',
        to,
        subject: `Hey ${name}, reset your password`,
        html: resetPass(actionData)
      };
      break;
    default:
      data;
  }

  return data;
};

/* The 'to' refers to the EMAIL wants to register to our App, 'name' is the name the user adds during the registration
process, the 'token' we'll be added later, and 'type' refers to the type of EMAIL we have above in the 'getEmailData'
SWITH, and in our case we just have ONE case(the 'welcome'), so THIS 'type' FOURTH argument refers to that 'welcome'
pretty much */
const sendEmail = (to, name, token, type, actionData = null) => {
  const smtpTransport = mailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'gokutra4@gmail.com',
      pass: process.env.EMAIL_PASS
    }
  });

  /* These four arguments we're passing here to the 'getEmailData' function are the SAME arguments that we pass to 
  the 'sendEmail' function */
  const mail = getEmailData(to, name, token, type, actionData);

  /* The 'mail' here below we're passing as FIRST argument refers to the 'mail' just here above that contains the
  'getEmailData' function pretty much */
  smtpTransport.sendMail(mail, (error, response) => {
    if (error) {
      console.log(error);
    } else {
      console.log('email sent');
    }
    smtpTransport.close();
  });
};

module.exports = { sendEmail };
