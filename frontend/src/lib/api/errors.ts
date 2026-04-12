import axios from "axios";

type ErrorBody = {
  error?: string;
  errors?: Array<{ message?: string }>;
};

export function getApiErrorMessage(err: unknown, fallback = "Greška. Pokušaj ponovo.") {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }
  const data = err.response?.data as ErrorBody | undefined;
  if (data?.error && typeof data.error === "string") {
    return data.error;
  }
  const first = data?.errors?.[0]?.message;
  if (first) {
    return first;
  }
  if (err.message) {
    return err.message;
  }
  return fallback;
}
