import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title?: string;
}

// Extract a YouTube video ID from watch, youtu.be, shorts, or embed URLs.
function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

export default function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const youTubeId = getYouTubeId(videoUrl);

    // Stop video when modal closes
    useEffect(() => {
        if (!isOpen && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`relative w-full bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 ${youTubeId ? "max-w-[420px] aspect-[9/16] max-h-[90vh]" : "max-w-5xl aspect-video"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 h-10 w-10 sm:h-12 sm:w-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer border border-white/20 group"
                        >
                            <X className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
                        </button>

                        {/* YouTube embed */}
                        {youTubeId && (
                            <iframe
                                src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                                className="w-full h-full"
                                title={title || "Video testimonial"}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        )}

                        {/* Direct video file */}
                        {videoUrl && !youTubeId && (
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full h-full object-contain"
                                controls
                                autoPlay
                                playsInline
                            />
                        )}

                        {/* Fallback if no video URL is provided (for demo purposes) */}
                        {!videoUrl && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-forest/20">
                                <p className="font-serif text-2xl mb-2">{title || "Video Testimonial"}</p>
                                <p className="font-inter text-sm">Video source not found.</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
