CREATE TABLE Users(
   id_users INTEGER,
   email TEXT NOT NULL,
   username TEXT NOT NULL,
   password TEXT,
   is_admin NUMERIC,
   PRIMARY KEY(id_users),
   UNIQUE(email),
   UNIQUE(username)
);

CREATE TABLE MiniGames(
   id_mini_games INTEGER,
   label TEXT,
   description TEXT,
   PRIMARY KEY(id_mini_games)
);

CREATE TABLE Tournaments(
   id_tournaments INTEGER,
   label TEXT,
   description TEXT,
   code TEXT NOT NULL,
   PRIMARY KEY(id_tournaments),
   UNIQUE(code)
);

CREATE TABLE Feedbacks(
   id_feedbacks INTEGER,
   description TEXT,
   id_users INTEGER NOT NULL,
   PRIMARY KEY(id_feedbacks),
   FOREIGN KEY(id_users) REFERENCES Users(id_users)
);

CREATE TABLE Challenges(
   id_challenges INTEGER,
   status TEXT,
   challenges_date NUMERIC NOT NULL,
   id_users_challenger INTEGER,
   id_mini_games INTEGER,
   id_users_challenged INTEGER,
   id_users_winner INTEGER,
   PRIMARY KEY(id_challenges),
   FOREIGN KEY(id_users_challenger) REFERENCES Users(id_users),
   FOREIGN KEY(id_mini_games) REFERENCES MiniGames(id_mini_games),
   FOREIGN KEY(id_users_challenged) REFERENCES Users(id_users),
   FOREIGN KEY(id_users_winner) REFERENCES Users(id_users)
);

CREATE TABLE Users_mini_games(
   id_users INTEGER,
   id_mini_games INTEGER,
   score INTEGER,
   PRIMARY KEY(id_users, id_mini_games),
   FOREIGN KEY(id_users) REFERENCES Users(id_users),
   FOREIGN KEY(id_mini_games) REFERENCES MiniGames(id_mini_games)
);

CREATE TABLE Users_mini_games_tournaments(
   id_users INTEGER,
   id_mini_games INTEGER,
   id_tournaments INTEGER,
   score INTEGER,
   PRIMARY KEY(id_users, id_mini_games, id_tournaments),
   FOREIGN KEY(id_users) REFERENCES Users(id_users),
   FOREIGN KEY(id_mini_games) REFERENCES MiniGames(id_mini_games),
   FOREIGN KEY(id_tournaments) REFERENCES Tournaments(id_tournaments)
);
