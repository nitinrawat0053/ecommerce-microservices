import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeRabbitMQUrl } from "../index";

describe("RabbitMQ URL Sanitization", () => {
  it("should mask username and password in standard AMQP connection URLs", () => {
    const rawUrl = "amqp://admin:secretPassword123@localhost:5672";
    const sanitized = sanitizeRabbitMQUrl(rawUrl);

    expect(sanitized).toBe("amqp://***:***@localhost:5672");
    expect(sanitized).not.toContain("admin");
    expect(sanitized).not.toContain("secretPassword123");
  });

  it("should mask credentials in AMQPS URLs with custom vhost", () => {
    const rawUrl = "amqps://production_user:SuperSecretToken@b-123.mq.us-east-1.amazonaws.com:5671/production";
    const sanitized = sanitizeRabbitMQUrl(rawUrl);

    expect(sanitized).toBe("amqps://***:***@b-123.mq.us-east-1.amazonaws.com:5671/production");
    expect(sanitized).not.toContain("production_user");
    expect(sanitized).not.toContain("SuperSecretToken");
  });

  it("should mask sensitive query parameters such as tokens or auth keys", () => {
    const rawUrl = "amqp://admin:pass@rabbitmq:5672?auth_token=jwt123&secret=xyz&client=shopmicro";
    const sanitized = sanitizeRabbitMQUrl(rawUrl);

    expect(sanitized).toContain("auth_token=***");
    expect(sanitized).toContain("secret=***");
    expect(sanitized).toContain("client=shopmicro");
    expect(sanitized).not.toContain("jwt123");
    expect(sanitized).not.toContain("xyz");
    expect(sanitized).not.toContain("admin");
    expect(sanitized).not.toContain("pass");
  });

  it("should preserve safe connection strings without credentials", () => {
    const rawUrl = "amqp://localhost:5672";
    const sanitized = sanitizeRabbitMQUrl(rawUrl);

    expect(sanitized).toBe("amqp://localhost:5672");
  });

  it("should safely handle empty or undefined inputs without throwing", () => {
    expect(sanitizeRabbitMQUrl("")).toBe("[not configured]");
    expect(sanitizeRabbitMQUrl(undefined)).toBe("[not configured]");
    expect(sanitizeRabbitMQUrl(null as any)).toBe("[not configured]");
  });

  it("should safely handle malformed URLs without throwing", () => {
    expect(sanitizeRabbitMQUrl("not a valid url :// :::")).toBe("[configured endpoint]");
  });
});
