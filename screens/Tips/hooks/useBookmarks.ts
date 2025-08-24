import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'tips_bookmarks';

export const useBookmarks = () => {
  const [bookmarkedTipIds, setBookmarkedTipIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const bookmarksJson = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarksJson) {
        const bookmarks = JSON.parse(bookmarksJson) as string[];
        setBookmarkedTipIds(new Set(bookmarks));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBookmarks = useCallback(async (bookmarks: Set<string>) => {
    try {
      const bookmarksArray = Array.from(bookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarksArray));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  const toggleBookmark = useCallback(
    async (tipId: string) => {
      const newBookmarks = new Set(bookmarkedTipIds);
      if (newBookmarks.has(tipId)) {
        newBookmarks.delete(tipId);
      } else {
        newBookmarks.add(tipId);
      }
      setBookmarkedTipIds(newBookmarks);
      await saveBookmarks(newBookmarks);
    },
    [bookmarkedTipIds, saveBookmarks],
  );

  const isBookmarked = useCallback(
    (tipId: string) => {
      return bookmarkedTipIds.has(tipId);
    },
    [bookmarkedTipIds],
  );

  return {
    bookmarkedTipIds,
    isLoading,
    loadBookmarks,
    toggleBookmark,
    isBookmarked,
  };
};
