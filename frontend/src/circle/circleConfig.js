import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const circleAppId = import.meta.env.VITE_CIRCLE_APP_ID;

if (!circleAppId) {
  console.warn("VITE_CIRCLE_APP_ID is not configured.");
}

export const circleSdk = new W3SSdk({
  appSettings: {
    appId: circleAppId,
  },
});

export function getCircleDeviceId() {
  return circleSdk.getDeviceId();
}

export function verifyCircleEmailOtp(otpSession) {
  return new Promise((resolve, reject) => {
    circleSdk.updateConfigs(
      {
        appSettings: {
          appId: circleAppId,
        },
        loginConfigs: {
          deviceToken: otpSession.deviceToken,
          deviceEncryptionKey: otpSession.deviceEncryptionKey,
          otpToken: otpSession.otpToken,
        },
      },
      (error, result) => {
        if (error) {
          reject(new Error(error.message || "Circle could not verify the email code."));
          return;
        }

        if (!result?.userToken || !result?.encryptionKey) {
          reject(new Error("Circle did not return a valid wallet session."));
          return;
        }

        resolve(result);
      }
    );

    circleSdk.verifyOtp();
  });
}

export function executeCircleChallenge({ challengeId, userToken, encryptionKey }) {
  return new Promise((resolve, reject) => {
    circleSdk.setAuthentication({ userToken, encryptionKey });
    circleSdk.execute(challengeId, (error, result) => {
      if (error) {
        reject(new Error(error.message || "Circle could not create the wallet."));
        return;
      }

      if (result?.status !== "COMPLETE") {
        reject(new Error(`Circle wallet setup ended with status: ${result?.status || "UNKNOWN"}.`));
        return;
      }

      resolve(result);
    });
  });
}
