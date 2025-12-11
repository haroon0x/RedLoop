'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Preloader } from './components/UI';

export default function ClientLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}
