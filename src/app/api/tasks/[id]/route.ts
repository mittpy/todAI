import { NextResponse } from "next/server";
import { deleteTask, getTask, TaskValidationError, updateTask } from "@/lib/tasks";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json({ task });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  try {
    const task = await updateTask(id, body);
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof TaskValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  if (!(await deleteTask(id))) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}
