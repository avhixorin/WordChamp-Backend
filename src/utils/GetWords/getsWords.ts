import { easyWords, godWords, hardWords, mediumWords } from "../../constants/Words";
import { Difficulty } from "../../types/Types";

export const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case Difficulty.EASY:
      return { wordPool: easyWords, wordCount: 5, timer: 5 * 60 };
    case Difficulty.MEDIUM:
      return { wordPool: mediumWords, wordCount: 4, timer: 3.5 * 60 };
    case Difficulty.HARD:
      return { wordPool: hardWords, wordCount: 3, timer: 2 * 60 };
    case Difficulty.GOD:
      return { wordPool: godWords, wordCount: 1, timer: 40 };
    default:
      return { wordPool: easyWords, wordCount: 5, timer: 5 * 60 };
  }
};

const shuffleString = (gameString: string): string => {
  const lettersArray = gameString.split("");
  for (let i = lettersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
  }
  return lettersArray.join("");
};

const getCurrentGameString = (difficulty: Difficulty): string => {
  const { wordPool, wordCount } = getDifficultySettings(difficulty);

  let tempString = "";
  for (let i = 0; i < wordCount && i < wordPool.length; i++) {
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    tempString += wordPool[randomIndex];
  }

  tempString = tempString.slice(0, 10);

  return shuffleString(tempString);
};

export default getCurrentGameString;
