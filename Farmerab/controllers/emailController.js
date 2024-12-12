const sgMail = require('../utils/emailUtility.js');

const sendEmail = async (to, subject, html) => {
    const msg = {
        to,
        from: process.env.SENDGRID_SENDER_EMAIL,
        subject,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error.response ? error.response.body : error.message);
        throw new Error('Failed to send email');
    }
};

module.exports = { sendEmail };
