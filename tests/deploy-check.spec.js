const { test, expect } = require('@playwright/test');

const BASE = 'https://zerror.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

function get(request, path) {
  return request.get(`${BASE}${path}`, { headers: { 'User-Agent': UA } });
}

test.describe('Production deploy check', () => {

  test('/smokecigar/ serves index.html', async ({ request }) => {
    const res = await get(request, '/smokecigar/');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('Smokecigar');
  });

  test('/smokecigar/index.html returns 200', async ({ request }) => {
    const res = await get(request, '/smokecigar/index.html');
    expect(res.status()).toBe(200);
  });

  test('/smokecigar/js/app.js returns 200', async ({ request }) => {
    const res = await get(request, '/smokecigar/js/app.js');
    expect(res.status()).toBe(200);
  });

  test('/smokecigar/js/mdl-parser.js returns 200', async ({ request }) => {
    const res = await get(request, '/smokecigar/js/mdl-parser.js');
    expect(res.status()).toBe(200);
  });

  test('/smokecigar/js/renderer.js returns 200', async ({ request }) => {
    const res = await get(request, '/smokecigar/js/renderer.js');
    expect(res.status()).toBe(200);
  });

  test('/smokecigar/css/style.css returns 200', async ({ request }) => {
    const res = await get(request, '/smokecigar/css/style.css');
    expect(res.status()).toBe(200);
  });
});
