//Formatowanie daty na dzień.miesiąc.rok
const formatDate = (dateString: string): string => {
  if (!dateString) return '...';
  const parts = dateString.split('-'); 
  
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`; 
  }
  
  return dateString; 
};

export { formatDate };