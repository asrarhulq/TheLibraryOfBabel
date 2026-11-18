import "server-only";
import { getChoiceblindRun } from "@/lib/db/choiceblindRuns";

export const ID_RE = /^[A-Za-z0-9]{10}$/;

export async function loadRun(id: string) {
  if (!ID_RE.test(id)) return null;
  try {
    return await getChoiceblindRun(id);
  } catch {
    return null;
  }
}
