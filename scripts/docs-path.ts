export function isDocumentationPath(path: string) {
  return /^docs\/.+\.md$/u.test(path);
}
