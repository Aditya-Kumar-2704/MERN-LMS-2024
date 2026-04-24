const paypal = require("paypal-rest-sdk");

function getPayPalConfig() {
  const mode = process.env.PAYPAL_MODE || "sandbox";
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const clientSecret =
    process.env.PAYPAL_CLIENT_SECRET ||
    process.env.PAYPAL_SECRET_ID ||
    process.env.PAYPAL_SECRET ||
    "";

  return {
    mode,
    clientId,
    clientSecret,
  };
}

function getPayPalConfigError() {
  const { clientId, clientSecret } = getPayPalConfig();

  if (!clientId || !clientSecret) {
    return "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in server/.env.";
  }

  return "";
}

const payPalConfig = getPayPalConfig();

paypal.configure({
  mode: payPalConfig.mode,
  client_id: payPalConfig.clientId,
  client_secret: payPalConfig.clientSecret,
});

console.log("PayPal configured in", payPalConfig.mode, "mode");

module.exports = {
  paypal,
  getPayPalConfigError,
};
