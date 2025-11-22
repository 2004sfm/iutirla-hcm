import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TestPage() {
    return (
        <div>
            <Avatar className="size-20">
                <AvatarImage src="/profile.png" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        </div>
    )
}