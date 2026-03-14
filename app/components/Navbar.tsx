"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <div style={{
      padding: 15,
      background: "#222",
      color: "white",
      display: "flex",
      gap: 20
    }}>
      <Link href="/">Dashboard</Link>
      <Link href="/students">Học viên</Link>
      <Link href="/teachers">Giáo viên</Link>
      <Link href="/schedule">Lịch hôm nay</Link>
    </div>
  );
}