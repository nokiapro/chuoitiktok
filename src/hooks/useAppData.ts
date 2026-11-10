import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_DATA } from '../types';
import type { AppData, Person } from '../types';

const STORAGE_KEY = 'streak-web-data-v2';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed.people && parsed.images) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_DATA;
  });

  // Auto save to localStorage (for convenience on same device)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save', e);
    }
  }, [data]);

  const updatePeople = useCallback((people: Person[]) => {
    setData((prev) => ({ ...prev, people }));
  }, []);

  const setPersonDay = useCallback((personId: string, day: number) => {
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId ? { ...p, currentDay: Math.max(0, day) } : p
      ),
    }));
  }, []);

  const advanceAll = useCallback(() => {
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) => ({
        ...p,
        currentDay: p.currentDay + 1,
      })),
    }));
  }, []);

  const addOrUpdateImage = useCallback((day: number, fileId: string) => {
    setData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [String(day)]: fileId,
      },
    }));
  }, []);

  const removeImage = useCallback((day: number) => {
    setData((prev) => {
      const next = { ...prev.images };
      delete next[String(day)];
      return { ...prev, images: next };
    });
  }, []);

  const importData = useCallback((newData: AppData) => {
    setData(newData);
  }, []);

  const resetData = useCallback(() => {
    if (confirm('Bạn chắc chắn muốn xóa toàn bộ dữ liệu?')) {
      setData(DEFAULT_DATA);
    }
  }, []);

  return {
    data,
    updatePeople,
    setPersonDay,
    advanceAll,
    addOrUpdateImage,
    removeImage,
    importData,
    resetData,
  };
}
