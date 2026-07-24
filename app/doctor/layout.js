export const metadata = {
  title: 'Swasthya Sathi - Doctor Console',
  description: 'Doctor console for Swasthya Sathi healthcare platform.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
