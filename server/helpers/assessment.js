function shuffleArray(items = []) {
  const array = [...items];

  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
}

function toTrimmedString(value) {
  return String(value || "").trim();
}

module.exports = {
  shuffleArray,
  toTrimmedString,
};
