import { logger } from "../lib/logger.js";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailProvider = {
  send(message: EmailMessage): Promise<{ provider: string }>;
};

export const emailProvider: EmailProvider = {
  async send(message) {
    logger.info(
      { to: message.to, subject: message.subject },
      "Sending email",
    );

    return {
      provider: "console",
    };
  },
};