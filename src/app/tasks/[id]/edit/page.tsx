import { redirect } from "next/navigation";

export default function EditTaskRedirect() {
  redirect("/#task-list");
}
