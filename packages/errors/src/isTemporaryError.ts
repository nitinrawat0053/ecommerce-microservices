export function isTemporaryError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const RETRYABLE_ERRORS = [
    "MongoNetworkError",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ECONNRESET",
  ];

  return RETRYABLE_ERRORS.some((RETRYABLE_ERROR) =>
    error.message.includes(RETRYABLE_ERROR)
  );
}