"use client";

import { useEffect, useState } from "react";

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/students")
      .then(res => res.json())
      .then(data => setStudents(data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Danh sách học viên</h1>

      {students.map((s) => (
        <div key={s.id}>
          {s.name} - {s.lessons} buổi
        </div>
      ))}
    </div>
  );
}