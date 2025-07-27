// const sgMail = require('../utils/emailUtility.js');

// const sendEmail = async (to, subject, html) => {
//     const msg = {
//         to,
//         from: process.env.SENDGRID_SENDER_EMAIL,
//         subject,
//         html,
//     };

//     try {
//         await sgMail.send(msg);
//         console.log('Email sent successfully');
//     } catch (error) {
//         console.error('Error sending email:', error.response ? error.response.body : error.message);
//         throw new Error('Failed to send email');
//     }
// };

// module.exports = { sendEmail };

const {emailConfig, transporter} = require('../utils/emailUtility.js');

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: emailConfig.fromAddress,
    to,
    subject,
    html,
  };

  try {
    // Verify SMTP connection
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendEmail };