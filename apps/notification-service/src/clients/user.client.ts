import axios from "axios";
import { config } from "@packages/config";

export class UserClient {
  async getUser(userId: string) {
    const response = await axios.get(
      `${config.USER_SERVICE_URL}/api/users/profile`,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );

    return response.data.data;
  }
}