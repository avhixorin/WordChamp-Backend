import { Router, Request, Response } from 'express';
import { easyWords, godWords, hardWords, mediumWords } from '../constants/Words';
import ApiResponse from "../utils/ApiResponse/ApiResponse";
import ApiError from '../utils/ApiError/ApiError';

const wordRouter = Router();

wordRouter.get('/getWords/:noOfWords/:difficulty', (req: Request, res: Response) => {
  const { noOfWords, difficulty } = req.params;  
  let words: string[] = [];
  
  const wordCount = parseInt(noOfWords, 10);

  if (isNaN(wordCount) || wordCount < 1) {
    throw new ApiError(400, 'Invalid number of words requested.');
  }

  switch (difficulty.toLowerCase()) {
    case "easy":
      words = easyWords; 
      break;
    case "medium":
      words = mediumWords; 
      break;
    case "hard":
      words = hardWords; 
      break;
    case "god":
      words = godWords; 
      break;
    default:
      throw new ApiError(400, 'Invalid difficulty level.');
  }

  words = words.sort(() => Math.random() - 0.5); 

  const limitedWords = words.slice(0, wordCount);
  console.log("Number of words requested: ", wordCount);
  console.log("Difficulty: ", difficulty);
  console.log("Filtered words: ", limitedWords);

  if (limitedWords.length === 0) {
    res.json(new ApiResponse(404, 'No words found matching your criteria.'));
  } else {
    res.json(new ApiResponse(200, 'Words retrieved successfully.', limitedWords));
  }
});

export default wordRouter;
