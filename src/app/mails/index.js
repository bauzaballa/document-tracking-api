const sgMail = require("@sendgrid/mail");

// Email Templates
const messagesUnreadHtml = require("./templates/messagesUnreadHtml");

class Mailer {
    #emailSender = process.env.MAIL_SENDER;

    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    /**
     * Messages unread
     * 
     * @param {string} to - Email recipient
    */
    messagesUnread = async (to) => {
        const message = {
            to,
            from: {
                email: this.#emailSender,
                name: 'Gestion Delsud'
            },
            subject: `Tienes mensajes sin leer - Delsud`,
            html: messagesUnreadHtml(),
        };

        try {
            await sgMail.send(message);
        } catch (error) {
            throw new Error(
                'Error sending unread messages email',
                error.message,
            );
        }
    }
}

module.exports = Mailer;