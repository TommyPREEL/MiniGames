CREATE TABLE Products(
   id INTEGER,
   name TEXT,
   quantity INTEGER,
   description TEXT,
   price NUMERIC(15,2),
   img text,
   PRIMARY KEY(id)
);

CREATE TABLE Categories(
   id INTEGER,
   name TEXT,
   img text,
   PRIMARY KEY(id)
);

CREATE TABLE Users(
   id INTEGER,
   firstname TEXT,
   lastname TEXT,
   email TEXT,
   address TEXT,
   password TEXT,
   is_admin BOOLEAN DEFAULT FALSE,
   PRIMARY KEY(id)
);

CREATE TABLE Orders(
   id INTEGER,
   id_users INTEGER,
   orders_date NUMERIC,
   total_price NUMERIC(15,2)  ,
   status TEXT,
   PRIMARY KEY(id),
   FOREIGN KEY(id_users) REFERENCES Users(id)
);

CREATE TABLE Products_Categories(
   id INTEGER,
   id_products INTEGER,
   id_categories INTEGER,
   PRIMARY KEY(id),
   FOREIGN KEY(id_products) REFERENCES Products(id),
   FOREIGN KEY(id_categories) REFERENCES Categories(id)
);

CREATE TABLE Product_Orders(
   id INTEGER,
   id_products INTEGER,
   id_orders INTEGER,
   quantity INTEGER,
   PRIMARY KEY(id),
   FOREIGN KEY(id_products) REFERENCES Products(id),
   FOREIGN KEY(id_orders) REFERENCES Orders(id)
);
