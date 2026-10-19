const formatDeadline = (deadline: string) => {
  let deadlineString = deadline.trim(); 

  if (deadlineString.includes(' ') && !deadlineString.includes('T')) {
    deadlineString = deadlineString.replace(' ', 'T');
  }

  const hasTimezoneInfo = deadlineString.endsWith('Z') || deadlineString.includes('+') || (deadlineString.lastIndexOf('-') > 10);

  if (!hasTimezoneInfo && deadlineString.length > 16) {
    deadlineString += 'Z';
  }

  const deadlineDate = new Date(deadlineString);
  const now = new Date();

  if (deadlineDate < now && deadlineDate.getFullYear() !== now.getFullYear()) {
    return deadlineDate.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  }

  try {
    return deadlineDate.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return "Nieprawidłowa data";
  }
};

export { formatDeadline };