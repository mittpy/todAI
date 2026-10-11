import { NextResponse } from "next/server";
import { createTask, listTasks, TaskValidationError } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ tasks: await listTasks(search) });
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
