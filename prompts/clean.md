Read `AGENTS.md` first and follow it strictly.

## Delete Folder
- admin
- categories
- dashboard
- exam
- exams
- practice
- questions
- subjects
- test-years

## Update
Update app.module.ts for the deleted folder

## Models to delete inside models folder

- category.model.ts
- exam.model.ts
- language-passage.model.ts
- language-question.model.ts
- question.model.ts
- refresh-token.model.ts
- subject.model.ts
- test-year.model.ts


## Authentification

- remove refresh-token implementation we stays only with jwt which will expires after 30 days inside the refresh-token we store only the id of the users that is the information to be stored inside the jwt

## clean
- clean also the schema-migration-service.ts to clean all models to stays only with the user and take it as the first migration the starting point