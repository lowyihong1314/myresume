export type MerchantProfile = {
  name: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  footerNote: string;
};

const MERCHANT_KEY = "easypos-merchant-profile";

const defaultMerchantProfile: MerchantProfile = {
  name: "EasyPOS Merchant",
  registrationNumber: "",
  phone: "",
  email: "",
  address: "",
  footerNote: "Thank you for your purchase.",
};

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMerchantProfile(value: unknown): value is MerchantProfile {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.registrationNumber === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.address === "string" &&
    typeof candidate.footerNote === "string"
  );
}

export function loadMerchantProfile(): MerchantProfile {
  if (!hasWindow()) return defaultMerchantProfile;

  try {
    const raw = window.localStorage.getItem(MERCHANT_KEY);
    if (!raw) return defaultMerchantProfile;

    const parsed = JSON.parse(raw);
    return isMerchantProfile(parsed) ? parsed : defaultMerchantProfile;
  } catch {
    window.localStorage.removeItem(MERCHANT_KEY);
    return defaultMerchantProfile;
  }
}

export function saveMerchantProfile(profile: MerchantProfile) {
  if (!hasWindow()) return;
  window.localStorage.setItem(MERCHANT_KEY, JSON.stringify(profile));
}
