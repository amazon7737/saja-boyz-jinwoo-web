import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" aria-label="흉흉 홈" className="flex shrink-0 items-center">
      <Image
        src="/brand/hyunghyung.svg"
        alt="흉흉"
        width={80}
        height={27}
        className="h-auto w-16"
      />
      <span className="sr-only">흉흉 홈</span>
    </Link>
  );
}
