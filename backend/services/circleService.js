import dotenv from "dotenv";

dotenv.config();

export const circleConfig = {
  appId: process.env.CIRCLE_APP_ID,
  apiKey: process.env.CIRCLE_API_KEY,
  clientKey: process.env.CIRCLE_CLIENT_KEY,
};

export function validateCircleConfig() {
  const required = [
    "CIRCLE_APP_ID",
    "CIRCLE_API_KEY",
    "CIRCLE_CLIENT_KEY",
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing Circle environment variables: ${missing.join(", ")}`
    );
  }

  console.log("✅ Circle configuration loaded.");
}