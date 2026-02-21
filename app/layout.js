import './globals.css';

export const metadata = {
  title: 'Movie Maker',
  description: 'Generate short movies from one prompt'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
