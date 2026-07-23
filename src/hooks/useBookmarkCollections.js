import { useState, useCallback } from 'react';
import { API_BASE } from '../constants/api';
import useAuthFetch from './useAuthFetch';

// Shared bookmark-collection logic (list / add / remove / create) for a single
// school. Used by both BookmarkMenu and the result-card actions menu so the
// add/remove behaviour and the stored school snapshot stay identical.
export default function useBookmarkCollections(school) {
  const apiFetch = useAuthFetch();
  const [cols, setCols] = useState([]);
  const [newName, setNewName] = useState('');

  const refresh = useCallback(() => {
    apiFetch(`${API_BASE}/api/schools/bookmarks/list`, { method: 'POST' })
      .then(r => r.json())
      .then(setCols)
      .catch(() => {});
  }, [apiFetch]);

  const toggle = useCallback(async (col) => {
    const inCol = col.schools.some(s => s._id === school._id);
    if (inCol) {
      await apiFetch(`${API_BASE}/api/schools/bookmarks/${col._id}/schools/${school._id}`, { method: 'DELETE' });
    } else {
      const s = {
        _id: school._id, schoolName: school.schoolName, district: school.district, state: school.state,
        totalStudents: school.totalStudents, totalTeachers: school.totalTeachers, totalClassrooms: school.totalClassrooms,
        lowestClass: school.lowestClass, highestClass: school.highestClass,
      };
      await apiFetch(`${API_BASE}/api/schools/bookmarks/${col._id}/schools`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ school: s }),
      });
    }
    refresh();
  }, [apiFetch, school, refresh]);

  const createCol = useCallback(async () => {
    if (!newName.trim()) return;
    const col = await apiFetch(`${API_BASE}/api/schools/bookmarks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }),
    }).then(r => r.json());
    setNewName('');
    setCols(prev => [...prev, col]);
  }, [apiFetch, newName]);

  return { cols, newName, setNewName, refresh, toggle, createCol };
}
