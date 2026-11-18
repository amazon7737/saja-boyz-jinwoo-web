import Link from 'next/link';
import type { ComponentProps } from 'react';

import { ListNavigationPending } from '@/components/feedback/list-navigation-pending';

export function ListLink({
  children,
  href = '/incidents',
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & {
  href?: ComponentProps<typeof Link>['href'];
}) {
  return (
    <Link {...props} href={href}>
      {children}
      <ListNavigationPending />
    </Link>
  );
}
