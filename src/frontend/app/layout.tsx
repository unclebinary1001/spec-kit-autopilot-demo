import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo List App',
  description: 'A simple todo list application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
