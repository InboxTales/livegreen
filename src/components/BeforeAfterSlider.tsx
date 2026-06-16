import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";

interface BeforeAfterProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage, beforeLabel = "Raw Honey", afterLabel = "Processed" }: BeforeAfterProps) {
    const [position, setPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const handleMove = (clientX: number) => {
        if (!containerRef.current || !dragging.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setPosition((x / rect.width) * 100);
    };

    useEffect(() => {
        const up = () => { dragging.current = false; };
        const move = (e: MouseEvent) => handleMove(e.clientX);
        const touchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
        window.addEventListener("mouseup", up);
        window.addEventListener("mousemove", move);
        window.addEventListener("touchend", up);
        window.addEventListener("touchmove", touchMove);
        return () => {
            window.removeEventListener("mouseup", up);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("touchend", up);
            window.removeEventListener("touchmove", touchMove);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative aspect-[16/10] rounded-3xl overflow-hidden cursor-ew-resize select-none border-4 border-white shadow-xl"
            onMouseDown={() => { dragging.current = true; }}
            onTouchStart={() => { dragging.current = true; }}>
            {/* After (full) */}
            <img loading="lazy" decoding="async" src={afterImage} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />

            {/* Before (clipped) */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
                <img loading="lazy" decoding="async" src={beforeImage} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" style={{ width: `${containerRef.current?.offsetWidth}px` }} />
            </div>

            {/* Divider */}
            <div className="absolute top-0 bottom-0" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
                <div className="h-full w-[3px] bg-white shadow-lg" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 bg-white rounded-full shadow-xl flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M5 3L1 8L5 13" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11 3L15 8L11 13" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-[#1B5E20]/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-inter">{beforeLabel}</div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-inter">{afterLabel}</div>
        </div>
    );
}
