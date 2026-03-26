import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeHandlerProps {
    children: React.ReactNode;
}

export const SwipeHandler: React.FC<SwipeHandlerProps> = ({ children }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const navigate = useNavigate();

    // Minimum distance to be considered a swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Swipe left logic => Go to Marcas
            navigate('/marcas');
        }

        // reset values
        setTouchStart(null);
        setTouchEnd(null);
    };

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        >
            {children}
        </div>
    );
};
