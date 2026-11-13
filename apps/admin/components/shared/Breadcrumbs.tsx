import React from 'react';
import { Text, Breadcrumb } from '@chakra-ui/react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <Breadcrumb.Root mb="4" fontSize="sm">
      <Breadcrumb.List>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <Breadcrumb.Item>
                {isLast ? (
                  <Breadcrumb.CurrentLink color="fg" fontWeight="medium">
                    {item.label}
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link 
                    href={item.href || '#'} 
                    color="fg.muted" 
                    fontWeight="medium" 
                    _hover={{ color: 'brand.500' }}
                  >
                    {item.label}
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
              {!isLast && (
                <Breadcrumb.Separator>
                  <Text 
                    as="span" 
                    className="material-symbols-outlined" 
                    fontSize="18px" 
                    color="fg.muted" 
                    transform="rotate(180deg)"
                  >
                    chevron_right
                  </Text>
                </Breadcrumb.Separator>
              )}
            </React.Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
