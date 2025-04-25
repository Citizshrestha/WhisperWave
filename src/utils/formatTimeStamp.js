export const formatTimestamp = (timestamp, showTime = false) => {
  if (!timestamp) return "Just now";

  let date;

  if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "Just now";
  }

  if (isNaN(date.getTime())) return "Just now";

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