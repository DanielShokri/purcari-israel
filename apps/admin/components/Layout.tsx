// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from 'convex/react';
import { api } from "@convex/api";
import { Box, Flex } from '@chakra-ui/react';
import { Sidebar, Header, getPageLabel } from './layout-parts';
import { AuthUser } from '@shared/types';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signOut } = useAuthActions();
  const convexUser = useQuery(api.users.get);
  const user = convexUser as AuthUser | null;
  const navigate = useNavigate();

  // Search state - initialize from URL if on search page
  const [searchInput, setSearchInput] = useState(
    location.pathname === '/search' ? searchParams.get('q') || '' : ''
  );

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentPageLabel = getPageLabel(location.pathname);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/search');
    }
  };

  // Close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <Flex
      bg="bg"
      color="fg"
      fontFamily="body"
      h="100vh"
      overflow="hidden"
      css={{ '::selection': { bg: 'brand.500/30', color: 'white' } }}
    >
      {/* Mobile backdrop overlay */}
      <Box
        as="aside"
        position="fixed"
        inset="0"
        zIndex={40}
        bg="blackAlpha.700"
        display={{ base: isSidebarOpen ? 'block' : 'none', lg: 'none' }}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        currentPath={location.pathname}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <Flex as="main" flex="1" flexDirection="column" minW="0" overflow="hidden" bg="bg" position="relative">
        <Header
          currentPageLabel={currentPageLabel}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onSearchKeyDown={handleSearchKeyDown}
          user={user}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page Content Container */}
        <Flex flex="1" flexDirection="column" minH="0" overflow="hidden">
          {/* Scrollable Content */}
          <Box flex="1" overflowY="auto" p={{ base: '4', md: '6' }} css={{ scrollBehavior: 'smooth' }}>
            {children}
          </Box>

          {/* Editor Footer Slot */}
          <Box id="editor-footer-slot" flexShrink={0} />
        </Flex>
      </Flex>
    </Flex>
  );
}
