import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nhà của tụi mình ♡',
  description: 'Một góc nhỏ để đếm ngày gặp nhau, lưu quán xinh và chuẩn bị những điều đáng nhớ.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
