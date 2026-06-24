import { cookies } from "next/headers";

const COOKIE_NAME = "gemini_api_key";

/** Gemini API 키 설정 여부 확인 (서버 컴포넌트용) */
export async function hasGeminiKey(): Promise<boolean> {
  if (process.env.GEMINI_API_KEY?.trim()) return true;
  try {
    const cookieStore = await cookies();
    const key = cookieStore.get(COOKIE_NAME)?.value;
    return Boolean(key?.trim());
  } catch {
    return false;
  }
}

/** Gemini API 키 가져오기 (서버 컴포넌트용) */
export async function getGeminiKey(): Promise<string> {
  if (process.env.GEMINI_API_KEY?.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value ?? "";
  } catch {
    return "";
  }
}
