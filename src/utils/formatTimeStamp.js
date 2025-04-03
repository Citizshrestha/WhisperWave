export const formatTimestamp = (timestamp, showTime = false) => {
  // Handle cases where timestamp might be undefined or null
  if (!timestamp) return "Just now";
  
  let date;
  
  // Check if it's a Firestore Timestamp object
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } 
  // Check if it's a raw timestamp object with seconds/nanoseconds
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  // Check if it's already a Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // If none of the above, return a fallback
  else {
    return "Just now";
  }

  // Format the date components
  const dateOptions = { day: "numeric", month: "short", year: "numeric" };
  const timeOptions = { hour: "2-digit", minute: "2-digit" };

  const formattedDate = date.toLocaleDateString("en-US", dateOptions);
  const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

  const day = date.getDate();
  const suffix = 
    day >= 11 && day <= 13 ? "th" : 
    day % 10 === 1 ? "st" : 
    day % 10 === 2 ? "nd" : 
    day % 10 === 3 ? "rd" : "th";

  const finalDate = formattedDate.replace(/(\d+)/, `$1${suffix}`);

  return showTime ? `${finalDate} · ${formattedTime}` : formattedTime;
};