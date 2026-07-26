import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { API_BASE_URL } from "../services/api";

const circleAppId = import.meta.env.VITE_CIRCLE_APP_ID;
const circleClientKey = import.meta.env.VITE_CIRCLE_CLIENT_KEY;

export const circleSdk = new W3SSdk(
  {
    appSettings: {
      appId: circleAppId,
      clientKey: circleClientKey,
    },
  },
  async (error, result) => {
    console.log("Circle Login Callback");

    if (error) {
      console.error("Circle Login Error:", error);
      return;
    }

    console.log("Circle Login Result:", result);

    if (result) {

      localStorage.setItem(
        "proofpay-circle-auth",
        JSON.stringify(result)
      );

      const response = await fetch(
        `${API_BASE_URL}/circle/initialize-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userToken: result.userToken,
          }),
        }
      );

      const data = await response.json();

      console.log("Initialize User:", data);

    }
  }
);
