import { useState, useCallback } from 'react';

const FALLBACK_GRADIENTS = [
  'from-slate-200 to-slate-300',
  'from-slate-300 to-slate-400',
  'from-slate-100 to-slate-200',
];

type SafeImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackIndex?: number;
};

export function SafeImage({ src, alt, className = '', fallbackIndex = 0 }: SafeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const gradient = FALLBACK_GRADIENTS[fallbackIndex % FALLBACK_GRADIENTS.length];

  const handleError = useCallback(() => {
    setErrored(true);
    setLoaded(true);
  }, []);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  if (!src || errored) {
    return (
      <div
        className={`bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-10 h-10 text-slate-400/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} animate-pulse ${className}`}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </>
  );
}
