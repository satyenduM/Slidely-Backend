import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = 3000;
const dbFile = 'db.json';

app.use(bodyParser.json());
app.use(cors());

interface SubmissionDetails {
  Name: string;
  Email: string;
  Phone: string;
  GitHubLink: string;
  StopwatchTime: string;
}

const readDatabase = (): SubmissionDetails[] => {
  try {
    const data = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(data).submissions;
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
};

const writeDatabase = (submissions: SubmissionDetails[]) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify({ submissions }, null, 2));
  } catch (error) {
    console.error('Error writing to database:', error);
  }
};

const validateSubmission = (submission: SubmissionDetails): string[] => {
  const errors: string[] = [];
  if (!submission.Name) errors.push('Name is required');
  if (!submission.Email) errors.push('Email is required');
  if (!submission.Phone) errors.push('Phone is required');
  if (!submission.GitHubLink) errors.push('GitHubLink is required');
  if (!submission.StopwatchTime) errors.push('StopwatchTime is required');
  return errors;
};

app.get('/ping', (req: Request, res: Response) => {
  res.send(true);
});

app.post('/submit', (req: Request, res: Response) => {
  const newSubmission: SubmissionDetails = req.body;
  const errors = validateSubmission(newSubmission);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const submissions = readDatabase();
  submissions.push(newSubmission);
  writeDatabase(submissions);
  res.status(201).send('Submission created');
});

app.get('/read', (req: Request, res: Response) => {
  const index = parseInt(req.query.index as string);
  const submissions = readDatabase();
  if (index >= 0 && index < submissions.length) {
    res.json(submissions[index]);
  } else {
    res.status(404).send('Submission not found');
  }
});

app.post('/update', (req: Request, res: Response) => {
  const updatedSubmission: SubmissionDetails = req.body;
  const errors = validateSubmission(updatedSubmission);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  let submissions = readDatabase();
  const index = submissions.findIndex(sub => sub.Name === updatedSubmission.Name);

  if (index !== -1) {
    submissions[index] = updatedSubmission;
    writeDatabase(submissions);
    console.log(`Updated submission: ${updatedSubmission.Name}`);
    res.send('Submission updated');
  } else {
    console.log(`Submission not found for update: ${updatedSubmission.Name}`);
    res.status(404).send('Submission not found');
  }
});

app.post('/delete', (req: Request, res: Response) => {
  const { Name } = req.body;
  let submissions = readDatabase();
  const initialLength = submissions.length;
  submissions = submissions.filter(sub => sub.Name !== Name);

  if (submissions.length < initialLength) {
    writeDatabase(submissions);
    console.log(`Deleted submission with Name: ${Name}`);
    res.send('Submission deleted');
  } else {
    console.log(`Submission with Name: ${Name} not found`);
    res.status(404).send('Submission not found');
  }
});

app.get('/submissions', (req: Request, res: Response) => {
  const submissions = readDatabase();
  res.json(submissions);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
