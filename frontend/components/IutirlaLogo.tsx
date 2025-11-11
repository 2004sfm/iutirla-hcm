import Image from "next/image";

export function IutirlaLogo() {
    return (
        <div className="flex items-center gap-1">
            <Image
                src="/logoiutirla.png"
                alt="Logo de IUTIRLA"
                width={256}
                height={351}
                className="h-10 w-auto"
            />
            {/* <div className="relative h-10 w-27 flex items-center text-2xl italic font-bold"> */}
            <div className="relative h-10 flex items-center font-montserrat text-2xl italic font-bold">

                <span>IUTIRLA</span>
                <span className="absolute top-0 font-semibold -right-4 text-[8px]">HCM</span>
            </div>
        </div>
    )
}