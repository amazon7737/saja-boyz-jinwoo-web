import Link from 'next/link';
import type { ComponentProps } from 'react';

import { ListNavigationPending } from '@/components/feedback/list-navigation-pending';

export function ListLink({
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'>) {
  return (
    <Link {...props} href="/incidents">
      {children}
      <ListNavigationPending />
    </Link>
  );
}
