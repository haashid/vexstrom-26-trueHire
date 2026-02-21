'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches IntersectionObserver to all elements with .reveal / .reveal-left /
 * .reveal-right / .reveal-scale classes inside the given root element.
 * When they enter the viewport the `.visible` class is added.
 */
export function useScrollReveal(deps: unknown[] = []) {
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const targets = document.querySelectorAll<HTMLElement>(
            '.reveal, .reveal-left, .reveal-right, .reveal-scale'
        );
        if (!targets.length) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target); // fire once
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        targets.forEach(el => observer.observe(el));
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return ref;
}
