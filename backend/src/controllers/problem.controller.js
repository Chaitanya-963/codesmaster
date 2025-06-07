import { db } from "../libs/db.js";
import { pollBatchResults, submitBatch } from "../libs/judge0.lib.js";

export const createProblem = async (req, res) => {
  // going to get the data from the request body

  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  // going to check the user role once again

  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "You are not allowed to create a problem" });
  }

  // loop through each reference solution for different langauge

  try {
    for (const [langauge, solutionCode] of Object.entries(referenceSolutions)) {
      const langaugeId = getJudge0LanguageId(langauge);
      if (!langaugeId) {
        return res.status(400).json({
          error: `Language ${langauge} is not supported`,
        });
      }

      const submissions = testcases.map(({ input, output }) => ({
        solution_code: solutionCode,
        langauge_id: langaugeId,
        stdin: input,
        expected_output: output,
      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map((res) => res.token);

      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.status.id !== 3) {
          return res.status(400).json({
            error: `Testcase ${i + 1} failed for language ${langauge}`,
          });
        }
      }
      // save the problem to the database

      const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          testcases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });

      return res.status(201).json(newProblem);
    }
  } catch (error) {}
};

export const getAllProblems = async (req, res) => {};

export const getProblemById = async (req, res) => {};

export const updateProblem = async (req, res) => {};

export const deleteProblem = async (req, res) => {};

export const getAllProblemsSolvedByUser = async (req, res) => {};
