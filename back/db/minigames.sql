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

CREATE TABLE Minigames(
   id_minigames INTEGER,
   label TEXT,
   description TEXT,
   PRIMARY KEY(id_minigames)
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
   id INTEGER,
   description TEXT,
   id_users INTEGER NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(id_users) REFERENCES Users(id_users)
);

CREATE TABLE Users_minigames(
   id_users INTEGER,
   id_minigames INTEGER,
   score INTEGER,
   PRIMARY KEY(id_users, id_minigames),
   FOREIGN KEY(id_users) REFERENCES Users(id_users),
   FOREIGN KEY(id_minigames) REFERENCES Minigames(id_minigames)
);

CREATE TABLE Users_minigames_tournaments(
   id_users INTEGER,
   id_minigames INTEGER,
   id_tournaments INTEGER,
   score INTEGER,
   PRIMARY KEY(id_users, id_minigames, id_tournaments),
   FOREIGN KEY(id_users) REFERENCES Users(id_users),
   FOREIGN KEY(id_minigames) REFERENCES Minigames(id_minigames),
   FOREIGN KEY(id_tournaments) REFERENCES Tournaments(id_tournaments)
);

CREATE TABLE Challenges(
   id_users INTEGER,
   id_users_1 INTEGER,
   id_minigames INTEGER,
   status TEXT,
   PRIMARY KEY(id_users, id_users_1, id_minigames),
   FOREIGN KEY(id_users) REFERENCES Users(id_users),
   FOREIGN KEY(id_users_1) REFERENCES Users(id_users),
   FOREIGN KEY(id_minigames) REFERENCES Minigames(id_minigames)
);
