import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
        </head>
      <body suppressHydrationWarning className="antialiased selection:bg-primary-container selection:text-on-primary-container">{children}</body>
    </html>
  );
}
