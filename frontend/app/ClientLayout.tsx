'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Preloader } from './components/UI';

export default function ClientLayout({
    children
}: {
    children: React.ReactNode
}) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <Preloader key="preloader" onComplete={() => setIsLoading(false)} />
                ) : (
                    children
                )}
            </AnimatePresence>
        </>
    );
}
