export async function GET() {
  const students = [
    { id: 1, name: "An", lessons: 10 },
    { id: 2, name: "Bình", lessons: 6 },
    { id: 3, name: "Chi", lessons: 15 }
  ];

  return Response.json(students);
}