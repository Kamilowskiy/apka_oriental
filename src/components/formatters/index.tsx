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

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pl-PL');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Format price for display
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return '-';
  
  try {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${price} PLN`;
  }
};

export {formatFileSize, formatPhoneNumber, formatDate, formatPrice};