function formatPhoneNumber(number: string) {
  const cleaned = number.replace(/\D/g, "");
  const formatted = cleaned.replace(/(\d{3})(?=\d)/g, "$1 ");
  return formatted;
} 


// Format file size to be human readable
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export {formatFileSize, formatPhoneNumber};