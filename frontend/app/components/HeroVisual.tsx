'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Video Background Component - Constrained to hero section only
export default function HeroVisual() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full overflow-hidden hover-trigger"
        >
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover animate-on-hover transition-all duration-300"
                style={{
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                }}
            >
                <source src="/hero-bg.webm" type="video/webm" />
            </video>

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none" />
        </motion.div>
    );
}
