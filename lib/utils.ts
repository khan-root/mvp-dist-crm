import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast as defaultToast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiErrorMessage(data: any, fallback: string = "An error occurred"): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;

  const mainError = data.error || data.message;

  if (data.details) {
    if (typeof data.details === "string") {
      return `${mainError ? `${mainError}: ` : ""}${data.details}`;
    }

    // Zod flatten() fieldErrors: { contact: ["Invalid email address"] }
    if (data.details.fieldErrors && typeof data.details.fieldErrors === "object") {
      const messages: string[] = [];
      for (const [field, errs] of Object.entries(data.details.fieldErrors)) {
        if (Array.isArray(errs) && errs.length > 0) {
          const fieldLabel = field
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
          messages.push(`${fieldLabel}: ${errs.join(", ")}`);
        }
      }
      if (messages.length > 0) {
        return `${mainError && mainError !== "Validation failed" ? `${mainError} — ` : ""}${messages.join("; ")}`;
      }
    }

    // Zod issues array: [{ path: ["contact", "email"], message: "Invalid email" }]
    if (Array.isArray(data.details)) {
      const messages = data.details.map((issue: any) => {
        const path = Array.isArray(issue.path) ? issue.path.join(".") : issue.path;
        const fieldLabel = path
          ? path.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (str: string) => str.toUpperCase())
          : "";
        return fieldLabel ? `${fieldLabel}: ${issue.message}` : issue.message;
      });
      if (messages.length > 0) {
        return `${mainError && mainError !== "Validation failed" ? `${mainError} — ` : ""}${messages.join("; ")}`;
      }
    }
  }

  if (mainError) return mainError;
  return fallback;
}

export function toastApiError(
  first: any,
  second?: any,
  third: string = "An error occurred"
) {
  let toastObj = defaultToast;
  let data = first;
  let fallback = typeof second === "string" ? second : third;

  if (first && typeof first.error === "function") {
    // 3-arg format: (toast, data, fallback)
    toastObj = first;
    data = second;
    fallback = third;
  } else if (typeof second === "string") {
    // 2-arg format: (data, fallback)
    data = first;
    fallback = second;
  }

  const message = getApiErrorMessage(data, fallback);
  if (toastObj && typeof toastObj.error === "function") {
    toastObj.error(message);
  }
}

