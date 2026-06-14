import "./globals.css";

export const metadata = {
  title: "KnowBot — AI Document Assistant",
  description: "Ask questions about your documents. Powered by RAG.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-violet-50 font-sans antialiased">{children}</body>
    </html>
  );
}
