const [url] = process.argv.slice(2);

try {
  const response = await fetch(url);
  process.exit(response.ok ? 0 : 1);
} catch {
  process.exit(1);
}
