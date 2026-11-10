import '@/index.css';
import { VerificationProvider } from '@/context/VerificationContext';

export const metadata = {
  title: 'Record – Video Verification',
  description: 'Mobile Video Verification Application for Record Technology Labs'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F6F1] font-sans text-slate-900 antialiased">
        <VerificationProvider>{children}</VerificationProvider>
      </body>
    </html>
  );
}

