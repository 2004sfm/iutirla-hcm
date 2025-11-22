import { redirect } from "next/navigation"

export default function PersonnelRedirect() {
    redirect("/admin/personnel/people");
}