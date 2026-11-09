// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Spinner,
  Grid,
} from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from "@convex/api";
import { Breadcrumbs } from '../components/shared';
import {
  SearchResultsSection,
  OrderResultCard,
  UserResultCard,
  ProductResultCard,
  CategoryResultCard,
} from '../components/search';

type TabType = 'all' | 'orders' | 'users' | 'products' | 'categories';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const results = useQuery(api.admin.globalSearch, queryParam ? {
    query: queryParam
  } : "skip");
  const isLoading = results === undefined;
  const isFetching = false; // Convex handles this automatically

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
      setActiveTab('all');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'הכל', count: results?.counts.total || 0 },
    { id: 'orders', label: 'הזמנות', count: results?.counts.orders || 0 },
    { id: 'users', label: 'משתמשים', count: results?.counts.users || 0 },
    { id: 'products', label: 'מוצרים', count: results?.counts.products || 0 },
    { id: 'categories', label: 'קטגוריות', count: results?.counts.categories || 0 },
  ];

  const renderEmptyState = () => (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py="20"
      textAlign="center"
    >
      <Flex
        bg="bg.subtle"
        p="6"
        rounded="full"
        mb="4"
      >
        <Text
          as="span"
          className="material-symbols-outlined"
          fontSize="48px"
          color="fg.subtle"
        >
          search_off
        </Text>
      </Flex>
      <Text fontSize="xl" fontWeight="bold" color="fg" mb="2">
        לא נמצאו תוצאות
      </Text>
      <Text color="fg.muted" maxW="md" mx="auto">
        לא מצאנו שום דבר שמתאים לחיפוש שלך. נסה לבדוק את האיות או להשתמש במילות מפתח אחרות.
      </Text>
    </Flex>
  );

  const renderInitialState = () => (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py="20"
      textAlign="center"
    >
      <Flex
        bg="blue.50"
        p="6"
        rounded="full"
        mb="4"
        _dark={{ bg: 'blue.900/20' }}
      >
        <Text
          as="span"
          className="material-symbols-outlined"
          fontSize="48px"
          color="blue.500"
        >
          search
        </Text>
      </Flex>
      <Text fontSize="xl" fontWeight="bold" color="fg" mb="2">
        חפש במערכת
      </Text>
      <Text color="fg.muted" maxW="md" mx="auto">
        הזן לפחות 2 תווים כדי לחפש בהזמנות, משתמשים, מוצרים וקטגוריות.
      </Text>
    </Flex>
  );

  const shouldShowResults = results && results.counts.total > 0;
  const showEmptyState = queryParam && queryParam.trim().length >= 2 && results && results.counts.total === 0;
  const showInitialState = !queryParam || queryParam.trim().length < 2;

  return (
    <VStack gap="0" align="stretch" h="full">
      <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'תוצאות חיפוש' }]} />

      <Box px={{ base: '4', md: '8' }} py="8" maxW="5xl" mx="auto" w="full">
        {/* Search Header */}
        <VStack gap="6" mb="8" align="stretch">
          <Flex
            flexDirection={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'stretch', md: 'flex-end' }}
            justifyContent="space-between"
            gap="4"
          >
            <Box>
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="bold"
                color="fg"
                lineHeight="tight"
              >
                {searchInput ? (
                  <>
                    תוצאות חיפוש עבור:{' '}
                    <Text as="span" color="blue.500">
                      "{searchInput}"
                    </Text>
                  </>
                ) : (
                  'חיפוש גלובלי'
                )}
              </Text>
              {results && searchInput && (
                <Text fontSize="sm" color="fg.muted" mt="1">
                  נמצאו {results.counts.total} תוצאות ({results.searchTime} שניות)
                </Text>
              )}
            </Box>
          </Flex>

          {/* Search Input - Always visible on mobile */}
          <Box position="relative" w="full">
            <Box
              position="absolute"
              right="4"
              top="50%"
              transform="translateY(-50%)"
              color="fg.muted"
              zIndex={1}
            >
              <Text as="span" className="material-symbols-outlined" fontSize="24px">
                search
              </Text>
            </Box>
            <Input
              placeholder="הזן מילות חיפוש..."
              size="lg"
              h="14"
              pr="12"
              pl="4"
              fontSize="lg"
              bg="bg.panel"
              borderColor="border"
              rounded="xl"
              shadow="sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              _focus={{
                borderColor: 'blue.500',
                ring: '2px',
                ringColor: 'blue.500/20',
              }}
            />
          </Box>

          {/* Tabs - Stack vertically on mobile */}
          {queryParam && queryParam.trim().length >= 2 && (
            <Box mb="8" borderBottomWidth="1px" borderColor="border">
              <HStack gap="8" overflowX="auto" pb="2" css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }} flexWrap="nowrap">
                {tabs.map((tab) => (
                  <Box
                    key={tab.id}
                    as="button"
                    pb="3"
                    borderBottomWidth="2px"
                    borderColor={activeTab === tab.id ? 'blue.500' : 'transparent'}
                    color={activeTab === tab.id ? 'blue.500' : 'fg.muted'}
                    fontWeight={activeTab === tab.id ? 'bold' : 'medium'}
                    fontSize="sm"
                    whiteSpace="nowrap"
                    transition="all 0.15s"
                    _hover={{ color: activeTab === tab.id ? 'blue.500' : 'fg' }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                    {tab.id !== 'all' && tab.count > 0 && (
                      <Text
                        as="span"
                        bg="bg.subtle"
                        color="fg.muted"
                        fontSize="xs"
                        px="1.5"
                        py="0.5"
                        rounded="full"
                        mr="1"
                      >
                        {tab.count}
                      </Text>
                    )}
                  </Box>
                ))}
              </HStack>
            </Box>
          )}

          {/* Loading State */}
          {(isLoading || isFetching) && queryParam && (
            <Flex justify="center" align="center" py="20">
              <VStack gap="4">
                <Spinner size="lg" color="blue.500" borderWidth="3px" />
                <Text color="fg.muted">מחפש...</Text>
              </VStack>
            </Flex>
          )}

          {/* Initial State */}
          {!isLoading && !isFetching && showInitialState && renderInitialState()}

          {/* Empty State */}
          {!isLoading && !isFetching && showEmptyState && renderEmptyState()}

          {/* Results */}
          {!isLoading && !isFetching && shouldShowResults && (
            <VStack gap="10" align="stretch">
              {/* Orders Section */}
              {(activeTab === 'all' || activeTab === 'orders') && results.orders.length > 0 && (
                <SearchResultsSection
                  title="הזמנות"
                  icon="shopping_bag"
                  count={results.counts.orders}
                  viewAllLink="/orders"
                  viewAllLabel={`צפה בכל ${results.counts.orders} ההזמנות`}
                >
                  <Box
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border"
                    rounded="xl"
                    shadow="sm"
                    overflow="hidden"
                  >
                    {results.orders.slice(0, activeTab === 'all' ? 3 : undefined).map((order) => (
                      <OrderResultCard
                        key={order._id}
                        order={order}
                        searchTerm={searchInput}
                      />
                    ))}
                  </Box>
                </SearchResultsSection>
              )}

              {/* Users Section */}
              {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                <SearchResultsSection
                  title="משתמשים"
                  icon="group"
                  count={results.counts.users}
                  viewAllLink="/users"
                  viewAllLabel={`צפה בכל ${results.counts.users} המשתמשים`}
                >
                  <Grid
                    templateColumns={{ base: '1fr', sm: '1fr', md: 'repeat(2, 1fr)' }}
                    gap="4"
                  >
                    {results.users.slice(0, activeTab === 'all' ? 4 : undefined).map((user) => (
                      <UserResultCard
                        key={user._id}
                        user={user}
                        searchTerm={searchInput}
                      />
                    ))}
                  </Grid>
                </SearchResultsSection>
              )}

              {/* Products Section */}
              {(activeTab === 'all' || activeTab === 'products') && results.products.length > 0 && (
                <SearchResultsSection
                  title="מוצרים"
                  icon="inventory_2"
                  count={results.counts.products}
                  viewAllLink="/products"
                  viewAllLabel={`צפה בכל ${results.counts.products} המוצרים`}
                >
                  <VStack gap="3" align="stretch">
                    {results.products.slice(0, activeTab === 'all' ? 3 : undefined).map((product) => (
                      <ProductResultCard
                        key={product._id}
                        product={product}
                        searchTerm={searchInput}
                      />
                    ))}
                  </VStack>
                </SearchResultsSection>
              )}

              {/* Categories Section */}
              {(activeTab === 'all' || activeTab === 'categories') && results.categories.length > 0 && (
                <SearchResultsSection
                  title="קטגוריות"
                  icon="category"
                  count={results.counts.categories}
                  viewAllLink="/categories"
                  viewAllLabel={`צפה בכל ${results.counts.categories} הקטגוריות`}
                >
                  <Grid
                    templateColumns={{ base: '1fr', sm: '1fr', md: 'repeat(2, 1fr)' }}
                    gap="4"
                  >
                    {results.categories.slice(0, activeTab === 'all' ? 4 : undefined).map((category) => (
                      <CategoryResultCard
                        key={category._id}
                        category={category}
                        searchTerm={searchInput}
                      />
                    ))}
                  </Grid>
                </SearchResultsSection>
              )}
            </VStack>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}