// Room photos are keyed by room index. When a room is deleted, drop its entry
// and shift every later key down by one so each room keeps its own photos.
export const removeRoomPhotos = (photoMap, removedIdx) => {
  const next = {};
  Object.keys(photoMap || {}).forEach((key) => {
    const i = Number(key);
    if (i < removedIdx) next[i] = photoMap[key];
    else if (i > removedIdx) next[i - 1] = photoMap[key];
  });
  return next;
};
