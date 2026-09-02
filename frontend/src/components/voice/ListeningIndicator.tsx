export default function ListeningIndicator() {
  const barHeights = [16, 28, 22, 30, 18];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-1.5 bg-danger-400 rounded-full"
            style={{
              height: `${h}px`,
              animation: `pulse-dot 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <p className="text-lg text-navy-600 animate-pulse">Listening...</p>
    </div>
  );
}
