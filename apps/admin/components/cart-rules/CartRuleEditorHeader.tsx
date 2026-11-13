import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Breadcrumbs } from '../shared';

interface CartRuleEditorHeaderProps {
  isEditMode: boolean;
}

export default function CartRuleEditorHeader({ isEditMode }: CartRuleEditorHeaderProps) {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'ראשי', href: '#/' },
          { label: 'חוקי עגלה', href: '#/cart-rules' },
          { label: isEditMode ? 'עריכת חוק' : 'יצירת חוק' }
        ]}
      />

      <Flex
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        align={{ base: 'start', sm: 'center' }}
        gap="4"
        mb="8"
      >
        <Box>
          <Heading size="2xl" color="fg" mb="1">
            {isEditMode ? 'עריכת חוק עגלה' : 'יצירת חוק עגלה'}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            {isEditMode ? 'ערוך את פרטי החוק והתנאים' : 'צור חוק חדש לעגלת הקניות'}
          </Text>
        </Box>
      </Flex>
    </>
  );
}
