import React, { useCallback, useRef } from 'react';
import { Searchbar } from 'react-native-paper';
import { debounce } from '../../lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export const SearchBar = React.memo(function SearchBar({
  placeholder = '搜索...',
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = React.useState('');
  const debouncedSearch = useRef(debounce(onSearch, debounceMs)).current;

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      debouncedSearch(text);
    },
    [debouncedSearch],
  );

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={handleChange}
      value={query}
      style={{ marginHorizontal: 16, marginVertical: 8 }}
    />
  );
});
