import React, { memo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface TransProps {
  translationKey: string;
  text: string;
  fallback?: string;
  children?: (translatedText: string, isLoading: boolean) => React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export const Trans: React.FC<TransProps> = memo(({
  translationKey,
  text,
  fallback,
  children,
  as: Component = 'span',
  className,
  ...props
}) => {
  const { t, isLoading } = useTranslation({ key: translationKey, text, fallback });

  if (children) {
    return <>{children(t, isLoading)}</>;
  }

  return (
    <Component className={className} {...props}>
      {isLoading ? (
        <span className="inline-block animate-pulse bg-gray-200 rounded px-1">
          {text}
        </span>
      ) : (
        t
      )}
    </Component>
  );
});

Trans.displayName = 'Trans';
