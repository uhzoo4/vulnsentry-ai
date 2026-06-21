

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function LoadingSkeleton({
  width = "100%",
  height = "1rem",
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div
      className={`bg-white/[0.04] border border-white/[0.02] rounded-md animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}
