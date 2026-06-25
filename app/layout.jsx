import './globals.css';

export const metadata = {
  title: 'Dompet Digital Nusantara',
  description: 'Personal Finance Management System berbasis web'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
