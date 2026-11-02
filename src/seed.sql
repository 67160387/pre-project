USE boardgame_db;
INSERT INTO publishers(id,name,country) VALUES (1,'Catan Studio','United States'),(2,'Asmodee','France'),(3,'Stonemaier Games','United States')
ON DUPLICATE KEY UPDATE name=VALUES(name),country=VALUES(country);
INSERT INTO categories(id,name,description) VALUES (1,'Strategy','Planning and decision making'),(2,'Family','Accessible games for families'),(3,'Engine Building','Build a system that improves over time')
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description);
INSERT INTO boardgames(id,name,min_players,max_players,playing_time_minutes,publisher_id,category_id) VALUES
(1,'Catan',3,4,90,1,1),(2,'Dobble',2,8,15,2,2),(3,'Wingspan',1,5,70,3,3)
ON DUPLICATE KEY UPDATE name=VALUES(name),min_players=VALUES(min_players),max_players=VALUES(max_players),playing_time_minutes=VALUES(playing_time_minutes),publisher_id=VALUES(publisher_id),category_id=VALUES(category_id);
