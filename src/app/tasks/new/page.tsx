import { redirect } from "next/navigation";

export default function NewTaskRedirect() {
  redirect("/#task-list");
}
