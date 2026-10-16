import { SmsConfiguration } from "../models/SmsConfiguration";
import { SmsLog } from "../models/SmsLog";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "****";
  }

  return `***${digits.slice(-4)}`;
}

function renderOtpTemplate(
  template: string,
  code: string,
  minutes: number
) {
  return template
    .replace(/{{code}}/g, code)
    .replace(/{{minutes}}/g, String(minutes));
}

async function getConfiguration() {
  const smsConfigurationModel: any = SmsConfiguration;

  return smsConfigurationModel.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function writeSmsLog(data: {
  provider: string;
  senderLabel: string;
  phoneMasked: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  providerMessageId?: string;
  error?: string;
}) {
  try {
    await SmsLog.create(data);
  } catch (error) {
    console.error("Unable to write SMS log:", error);
  }
}

function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();

  return {
    accountSid,
    authToken,
    from,
    configured: Boolean(accountSid && authToken),
    senderConfigured: Boolean(from),
  };
}

function createTwilioAuthorization(
  accountSid: string,
  authToken: string
) {
  return `Basic ${Buffer.from(
    `${accountSid}:${authToken}`
  ).toString("base64")}`;
}

export async function getOtpTtlSeconds() {
  const configuration = await getConfiguration();

  return configuration.otpTtlSeconds;
}

export async function getSmsProviderStatus() {
  const credentials = getTwilioCredentials();

  if (!credentials.configured) {
    return {
      provider: "TWILIO",
      credentialsConfigured: false,
      senderConfigured: credentials.senderConfigured,
      balance: null as number | null,
      currency: null as string | null,
      balanceError: "Twilio credentials are missing",
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/Balance.json`,
      {
        headers: {
          Authorization: createTwilioAuthorization(
            credentials.accountSid!,
            credentials.authToken!
          ),
        },
      }
    );

    if (!response.ok) {
      return {
        provider: "TWILIO",
        credentialsConfigured: true,
        senderConfigured: credentials.senderConfigured,
        balance: null as number | null,
        currency: null as string | null,
        balanceError: "Unable to read provider credits",
      };
    }

    const data = (await response.json()) as {
      balance?: string;
      currency?: string;
    };

    const balance = Number(data.balance);

    return {
      provider: "TWILIO",
      credentialsConfigured: true,
      senderConfigured: credentials.senderConfigured,
      balance: Number.isFinite(balance) ? balance : null,
      currency: data.currency || null,
      balanceError: null as string | null,
    };
  } catch {
    return {
      provider: "TWILIO",
      credentialsConfigured: true,
      senderConfigured: credentials.senderConfigured,
      balance: null as number | null,
      currency: null as string | null,
      balanceError: "Unable to contact the SMS provider",
    };
  }
}

export async function sendOtpSms(phone: string, code: string) {
  const configuration = await getConfiguration();
  const phoneMasked = maskPhone(phone);

  if (!configuration.enabled) {
  const error = "SMS delivery is disabled";

  await writeSmsLog({
    provider: configuration.provider,
    senderLabel: configuration.senderLabel,
    phoneMasked,
    status: "SKIPPED",
    error,
  });

  if (process.env.NODE_ENV === "production") {
    throw new Error(error);
  }

  return;
}

  const credentials = getTwilioCredentials();

  if (
    !credentials.accountSid ||
    !credentials.authToken ||
    !credentials.from
  ) {
    const error =
      "SMS is enabled but Twilio configuration is missing in backend/.env";

    await writeSmsLog({
      provider: configuration.provider,
      senderLabel: configuration.senderLabel,
      phoneMasked,
      status: "FAILED",
      error,
    });

    throw new Error(error);
  }

  const body = new URLSearchParams({
    To: phone,
    From: credentials.from,
    Body: renderOtpTemplate(
      configuration.otpTemplate,
      code,
      Math.ceil(configuration.otpTtlSeconds / 60)
    ),
  });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: createTwilioAuthorization(
            credentials.accountSid,
            credentials.authToken
          ),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!response.ok) {
      const providerError = (await response.text()).slice(0, 500);

      await writeSmsLog({
        provider: configuration.provider,
        senderLabel: configuration.senderLabel,
        phoneMasked,
        status: "FAILED",
        error: providerError || "Unable to send SMS OTP",
      });

      throw new Error("Unable to send SMS OTP");
    }

    const result = (await response.json()) as { sid?: string };

    await writeSmsLog({
      provider: configuration.provider,
      senderLabel: configuration.senderLabel,
      phoneMasked,
      status: "SENT",
      providerMessageId: result.sid,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unable to send SMS OTP") {
      throw error;
    }

    await writeSmsLog({
      provider: configuration.provider,
      senderLabel: configuration.senderLabel,
      phoneMasked,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown SMS error",
    });

    throw error;
  }
}