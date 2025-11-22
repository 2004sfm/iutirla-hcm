import { redirect } from "next/navigation"

export default function OrganizationRedirect() {
    redirect("/admin/organization/departments");
}