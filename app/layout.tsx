import Navbar from "./components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Navbar />
        <div style={{ padding: 20 }}>
          {children}
        </div>
      </body>
    </html>
  );
}