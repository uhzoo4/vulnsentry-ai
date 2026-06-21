import { useRef } from "react"
import { useFrame } from "@react-three/fiber"

export default function HostCard() {
    const cardRef = useRef<HTMLDivElement>(null)
    const hostRef = useRef<HTMLDivElement>(null)
    const ipRef = useRef<HTMLDivElement>(null)
    const subRef = useRef<HTMLDivElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)

    useFrame(({ mouse }) => {
        if (
            !cardRef.current ||
            !hostRef.current ||
            !ipRef.current ||
            !subRef.current ||
            !glowRef.current
        )
            return

        const rx = mouse.y * 10
        const ry = mouse.x * 12

        cardRef.current.style.transform =
            `rotateX(${-rx}deg) rotateY(${ry}deg)`

        hostRef.current.style.transform =
            `translate3d(${mouse.x * 8}px, ${mouse.y * 4}px, 20px)`

        ipRef.current.style.transform =
            `translate3d(${mouse.x * 14}px, ${mouse.y * 8}px, 40px)`

        subRef.current.style.transform =
            `translate3d(${mouse.x * 18}px, ${mouse.y * 12}px, 60px)`

        glowRef.current.style.transform =
            `translate3d(${mouse.x * 25}px, ${mouse.y * 20}px, 0px)`
    })

    return (
        <div
            ref={cardRef}
            className="
      relative
      w-[120px]
      px-4
      py-3
      rounded-xl
      border border-white/10
      bg-slate-950/80
      backdrop-blur-xl
      shadow-2xl
      overflow-hidden
      transition-transform duration-300
      "
            style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
        >
            <div
                ref={glowRef}
                className="
        absolute
        -inset-10
        rounded-full
        bg-cyan-500/10
        blur-3xl
        pointer-events-none
        "
            />

            <div
                ref={hostRef}
                className="
        relative
        text-white
        font-bold
        tracking-[0.3em]
        text-[10px]
        "
            >
                HOST
            </div>

            <div
                ref={ipRef}
                className="
        text-slate-300
        text-[9px]
        mt-1
        "
            >
                127.0.0.1
            </div>

            <div
                ref={subRef}
                className="
        text-[7px]
        uppercase
        tracking-widest
        text-slate-500
        mt-1
        "
            >
                Your Machine
            </div>
        </div>
    )
}