import { Resend } from "resend";
import { config } from "@packages/config";

export const resend = new Resend(config.RESEND_API_KEY);