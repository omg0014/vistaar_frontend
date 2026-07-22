import { useEffect, useRef, useCallback } from 'react';

// Returns a ref-callback to attach to elements that should fade/slide in as they
// scroll into view. Adds the `is-visible` class (see .reveal in global.css) once,
// then stops observing. Reveals immediately when IntersectionObserver is missing
// or the user prefers reduced motion. Works with lists that append over time
// (infinite scroll): elements registered after mount are observed right away.
export default function useScrollReveal() {
  const observerRef = useRef(null);
  const pendingRef  = useRef([]);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (typeof IntersectionObserver === 'undefined' || reduced) {
      pendingRef.current.forEach(el => el.classList.add('is-visible'));
      pendingRef.current = [];
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    observerRef.current = obs;
    pendingRef.current.forEach(el => obs.observe(el));
    pendingRef.current = [];
    return () => obs.disconnect();
  }, []);

  return useCallback((el) => {
    if (!el) return;
    if (observerRef.current) observerRef.current.observe(el);
    else pendingRef.current.push(el); // registered before the observer exists (initial mount)
  }, []);
}
