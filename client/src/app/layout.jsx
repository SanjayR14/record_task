import { DM_Sans } from 'next/font/google';
import '@/index.css';
import { VerificationProvider } from '@/context/VerificationContext';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans'
});

export const metadata = {
  title: 'Record – Video Verification',
  description: 'Mobile Video Verification Application for Record Technology Labs'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} min-h-screen bg-[#F8F6F1] font-sans text-slate-900 antialiased`}>
        <VerificationProvider>{children}</VerificationProvider>
      </body>
    </html>
  );
}
