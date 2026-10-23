export const DAY_MS = 86_400_000;

export const dayKey = (t: number | Date = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

export const dayStart = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};
