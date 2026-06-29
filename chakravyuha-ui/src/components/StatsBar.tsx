"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 22, suffix: "+", label: "Languages" },
  { value: 28, suffix: "", label: "Scenarios" },
  { value: 100, suffix: "%", label: "Hallucination-Free" },
  { value: 3, suffix: "ms", label: "Response" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let frame = 0;
        const total = 30;
        const step = () => {
          frame++;
          setCount(Math.round((frame / total) * target));
          if (frame < total) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-3xl font-bold" style={{ color: "var(--color-teal)" }}>
      {count}{suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="flex justify-around py-6 px-4 glass rounded-2xl mx-4">
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1">
          <CountUp target={s.value} suffix={s.suffix} />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            {s.label}
          </span>
        </div>
      ))}
    </section>
  );
}
