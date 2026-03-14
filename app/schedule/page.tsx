export default function Schedule() {
  const classes = [
    { time: "09:00", teacher: "Thầy Minh", student: "An" },
    { time: "10:00", teacher: "Cô Lan", student: "Bình" },
    { time: "14:00", teacher: "Thầy Nam", student: "Chi" }
  ];

  return (
    <div>
      <h1>Lịch dạy hôm nay</h1>

      {classes.map((c, i) => (
        <div key={i} style={{ border: "1px solid #ddd", padding: 10, margin: 10 }}>
          {c.time} - {c.teacher} dạy {c.student}
        </div>
      ))}
    </div>
  );
}