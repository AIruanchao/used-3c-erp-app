import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep the ref updated so the debounced call uses the latest callback
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearchRef.current(text);
      }, debounceMs);
    },
    [debounceMs],
  );

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={handleChange}
      value={query}
      style={styles.searchbar}
      accessibilityLabel={placeholder}
    />
  );
});

const styles = StyleSheet.create({
  searchbar: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
});
