import type { Metadata } from 'next';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'KU ơi, mình đi đâu thế',
  description: 'Một góc nhỏ để đếm ngày gặp nhau, lưu quán xinh và chuẩn bị những điều đáng nhớ.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'KU ơi' },
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pwaVersion = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
  return <html lang="vi"><body>{children}<PwaUpdatePrompt version={pwaVersion} /></body></html>;
}
