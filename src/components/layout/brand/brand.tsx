import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" aria-label="흉흉 홈" className="flex shrink-0 items-center">
      <Image src="/brand/hyunghyung.svg" alt="흉흉" width={64} height={24} />
      <span className="sr-only">흉흉 홈</span>
    </Link>
  );
}
