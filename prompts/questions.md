For the questions -> Culture generale & Langues those sets of questions is for all sections if all sections et to get theme a could use 

/culture-generale?random -> a I get a set of questions
/langues?random -> a get of question 

the set of questions belonging to Cours d'options is only specific for that sections only the user who is is that sections is the one who should see it and sciences it the one who should belong only for a specific sections

remove the lessons controller
[](../src/lessons/) -> remove this folder

- we need a way to add a admin and also to remove and admin so we can invite to be an admin to add questionns
- [](../src/cloudinary/) -> remove cloudinary and config

-- for questions remove

export class CreateCustomQuestionDto {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null; -> remove explanation
}

export class CreateCustomSetDto {
  title: string; -> only title here
  description?: string | null;
}

bull shit

  @Get()
  @ApiOperation({
    summary: 'Student dashboard bootstrap',
    description:
      'Returns the aggregated counters needed by the student dashboard in a single request.',
  })
  @ApiOkResponse({
    description: 'Aggregated dashboard data',
    schema: {
      example: {
        xp: 120,
        current_streak: 4,
        longest_streak: 9,
        total_answered: 87,
        correct_answers: 63,
        custom_set_count: 5,
      },
    },
  })

remove [](../src/dashboard/) -> remove this folder

for invitation if your are invited to set you can modify it not only delete it and you can be invited to have full access but not to delete and the set it will be like a community

- questions category -> Culture Generale, Cours d'options, Sciences & Langues

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

REMOVE THIS UNUSED FILE


CHECK THE NECESSITY OF SHARED QUIZ FOLDER
SUBJECT CONTROLLER -> SEE ALSO THE NECCESSITY
TEST YEARS -> TABLE NECESSITY

export const SUBJECT_BRANCH_TYPES = [
  'Culture Générale',
  'Sciences',
  "Cours d'options",
  'Langues',
  'Dissertation',
  'Jury Oral Français',
  'Jury Oral',
  'Jury Oral Anglais',
] as const;

mUST HAVE MIDDLE WARE NESTJS APP FOR BETTER PERFORMANCE APP

API EXPLANATION AND USAGE SWAGGER

- Ip tracking based on to get the location of the users we will extract only the user town inside the id address -> how to be sure about the town city in drc we will use the surrunding
