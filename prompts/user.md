


Refer

[](../src/models/profile.model.ts) -> Keep model
[](../src/models/user-role.model.ts) -> keep model
[](../src/models/user-streak.model.ts) -> Keep model
[](../src/models/user-progress.model.ts) -> REmove model

## User streak model

 {
  userId: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
}

## User Profil model

- remove xp: number
- remove table of sections we have a list of sections


## have 

- have a signle route to update the section 
- have also a route a update the profile for user
- get user with also the longest_steak, and current
- last activity to calculate number of days the user is not connected to send him a message on gmail