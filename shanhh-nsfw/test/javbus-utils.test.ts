import assert from "node:assert/strict";
import test from "node:test";
import { parseJavbusDetail, parseJavbusMagnets, parseJavbusSearchResults } from "../src/utils/javbus-utils.ts";

const host = "https://www.javbus.com";

test("parses search results and resolves relative URLs", () => {
  const html = `
    <div id="waterfall">
      <div class="item">
        <a class="movie-box" href="/ABC-001">
          <div class="photo-frame"><img src="/cover.jpg" title="Example" /></div>
        </a>
        <date>ABC-001</date><date>2024-01-02</date>
        <div class="item-tag"><span class="btn">Tag</span></div>
      </div>
      <div class="item"><div class="photo-frame"><img /></div></div>
    </div>`;

  assert.deepEqual(parseJavbusSearchResults(html, host), [
    {
      url: "https://www.javbus.com/ABC-001",
      thumbnail: "https://www.javbus.com/cover.jpg",
      title: "Example",
      code: "ABC-001",
      date: "2024-01-02",
      tags: ["Tag"],
    },
  ]);
});

test("parses details without manufacturing missing URLs", () => {
  const html = `
    <a class="bigImage"><img src="/cover.jpg" title="Example" /></a>
    <div class="info">
      <p><span class="header">識別碼:</span><span>ABC-001</span></p>
      <p><span class="header">發行日期:</span>2024-01-02</p>
      <p><span class="header">長度:</span>120 minutes</p>
      <p><span class="header">導演:</span><a href="/director/1">Director</a></p>
    </div>
    <div id="sample-waterfall"><a class="sample-box" href="/sample.jpg"></a></div>
    <script>var gid = 123; var uc = 0; var img = '/cover.jpg';</script>`;

  const detail = parseJavbusDetail("https://www.javbus.com/ABC-001", html, host);
  assert.equal(detail.thumbnail, "https://www.javbus.com/cover.jpg");
  assert.equal(detail.code, "ABC-001");
  assert.equal(detail.date, "2024-01-02");
  assert.equal(detail.director.url, "https://www.javbus.com/director/1");
  assert.equal(detail.images[0], "https://www.javbus.com/sample.jpg");
  assert.equal(detail.magnetSearchUrl, "https://www.javbus.com/ajax/uncledatoolsbyajax.php?gid=123&lang=zh&img=%2Fcover.jpg&uc=0");

  const missing = parseJavbusDetail("https://www.javbus.com/ABC-001", "<html></html>", host);
  assert.equal(missing.thumbnail, "");
  assert.equal(missing.magnetSearchUrl, "");
});

test("keeps only rows containing magnet links", () => {
  const html = `
    <table>
      <tr><th>Name</th><th>Size</th><th>Date</th></tr>
      <tr><td><a href="magnet:?xt=urn:btih:abc">Example</a></td><td>1 GB</td><td>2024-01-02</td></tr>
      <tr><td>No link</td></tr>
    </table>`;

  assert.deepEqual(parseJavbusMagnets(html), [{ title: "Example", magnet: "magnet:?xt=urn:btih:abc", size: "1 GB", date: "2024-01-02", tags: [] }]);
});
