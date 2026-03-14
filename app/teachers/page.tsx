export default function Teachers() {
  const teachers = [
    { name: "Thầy Minh", students: 15 },
    { name: "Cô Lan", students: 12 },
    { name: "Thầy Nam", students: 8 }
  ];

  return (
    <div>
      <h1>Danh sách giáo viên</h1>

      {teachers.map((t, i) => (
        <div key={i} style={{ border: "1px solid #ccc", padding: 10, margin: 10 }}>
          {t.name} - {t.students} học viên
        </div>
      ))}
    </div>
  );
}