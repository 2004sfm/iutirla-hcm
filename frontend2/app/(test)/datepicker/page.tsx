import { DatePicker } from "@/components/ui/date-picker"

export default function DatePickerPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Date Picker</h1>
                <DatePicker />
                <input type="date" />
            </div>
        </div>
    )
}
