interface WingLogoProps {
  size?: number;
  className?: string;
}

export function WingLogo({ size = 32, className = "" }: WingLogoProps) {
  const iconSize = size * 0.55;

  return (
    <div
      className={`rounded-lg bg-amber flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 122.88 121.46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.35,121.46c-8.01-9.72-11.92-19.29-12.31-28.71C-0.78,73.01,10.92,58.28,28.3,47.67 c18.28-11.16,37.08-13.93,55.36-22.25C92.79,21.27,103.68,14.47,121.8,0c5.92,15.69-12.92,40.9-43.52,54.23 c9.48,0.37,19.69-2.54,30.85-9.74c-0.76,19.94-16.46,32.21-51.3,36.95c7.33,2.45,16.09,2.58,27.27-0.58 C74.33,116.81,29.9,91.06,12.35,121.46L12.35,121.46z"
          fill="white"
        />
      </svg>
    </div>
  );
}
