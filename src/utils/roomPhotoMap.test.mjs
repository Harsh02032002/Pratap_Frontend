import assert from "node:assert/strict";
import { removeRoomPhotos } from "./roomPhotoMap.js";

const map = { 0: ["a"], 1: ["b"], 2: ["c"] };
assert.deepEqual(removeRoomPhotos(map, 1), { 0: ["a"], 1: ["c"] });
assert.deepEqual(removeRoomPhotos(map, 0), { 0: ["b"], 1: ["c"] });
assert.deepEqual(removeRoomPhotos(map, 2), { 0: ["a"], 1: ["b"] });
assert.deepEqual(removeRoomPhotos({ 0: ["a"], 2: ["c"] }, 1), { 0: ["a"], 1: ["c"] });
assert.deepEqual(removeRoomPhotos(undefined, 0), {});
console.log("roomPhotoMap tests passed");
