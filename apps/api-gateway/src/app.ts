import express from "express";
import routes from "./routes";

const app = express();

app.set("trust proxy", 1);

// Gateway Header Sanitization Middleware
// Strips untrusted client headers and normalizes X-Forwarded-For to the verified client IP
app.use((req, _res, next) => {
  // Strip client-supplied identity/internal headers from untrusted external traffic
  delete req.headers["x-user-id"];
  delete req.headers["x-user-role"];
  delete req.headers["x-internal-secret"];

  // Normalize x-forwarded-for to the real client IP verified by the gateway
  // Prevents clients from bypassing downstream IP rate limiters via forged headers
  const realIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
  req.headers["x-forwarded-for"] = realIp;

  next();
});

app.use("/api", routes);

export default app;
