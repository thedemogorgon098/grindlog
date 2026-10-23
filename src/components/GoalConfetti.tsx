"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function GoalConfetti({ hit, day }: { hit: boolean; day: string }) {
  useEffect(() => {
    if (!hit) return;
    try {
      if (localStorage.getItem("confetti") === day) return;
      localStorage.setItem("confetti", day);
    } catch {}
    const colors = ["#ffd23f", "#ff7ab6", "#5cc8ff", "#b8f35a", "#ff8a3d"];
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.3 }, colors, shapes: ["square"], scalar: 1.2 });
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors, shapes: ["square"] }), 250);
  }, [hit, day]);
  return null;
}
