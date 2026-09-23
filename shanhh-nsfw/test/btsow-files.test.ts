import assert from "node:assert/strict";
import test from "node:test";
import { extractBtsowFileCategories, groupBtsowFiles } from "../src/utils/btsow-files.ts";

const files = [
  { name: "notes.txt", size: "1 KB" },
  { name: "cover.JPG", size: "2 MB" },
  { name: "archive.7z", size: "4 GB" },
  { name: "movie.mkv", size: "8 GB" },
  { name: "sample.mp4", size: "3 GB" },
  { name: "track.flac", size: "30 MB" },
  { name: "poster.webp", size: "1 MB" },
  { name: "readme", size: "1 KB" },
];

test("groups video, image, and archive files first in the requested order", () => {
  const groups = groupBtsowFiles(files);

  assert.deepEqual(
    groups.priority.map((group) => group.category),
    ["Video", "Image", "Archive"],
  );
  assert.deepEqual(
    groups.priority.map((group) => group.files.map((file) => file.name)),
    [["movie.mkv", "sample.mp4"], ["cover.JPG", "poster.webp"], ["archive.7z"]],
  );
  assert.deepEqual(
    groups.other.map((file) => file.name),
    ["notes.txt", "track.flac", "readme"],
  );
});

test("extracts distinct file categories while ignoring files without extensions", () => {
  assert.deepEqual(extractBtsowFileCategories(files.map((file) => file.name)), ["Document", "Image", "Archive", "Video", "Audio"]);
});
