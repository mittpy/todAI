import { NextResponse } from "next/server";
import { countTasks, createTask, listTasks, TaskValidationError } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = params.get("q") ?? "";
  const page = parsePositiveInteger(params.get("page"), 1);
  const limit = parsePositiveInteger(params.get("limit"), 20);
  if (!page || !limit || limit > 100) {
    return NextResponse.json(
      { error: "Page must be positive and limit must be between 1 and 100." },
      { status: 400 },
    );
  }
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) {
    return NextResponse.json({ error: "Page is too large." }, { status: 400 });
  }

  const total = await countTasks(search);
  const tasks = await listTasks(search, limit, offset);
  return NextResponse.json({ tasks, total, page, limit });
}

function parsePositiveInteger(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  if (!/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  try {
    const task = await createTask(body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof TaskValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
