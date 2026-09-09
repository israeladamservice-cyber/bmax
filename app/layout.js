import './globals.css';

export const metadata = {
  title: 'Bmax - Social + Create + Play + Collaborate',
  description: 'The next-generation platform for builders, creators, and communities.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
