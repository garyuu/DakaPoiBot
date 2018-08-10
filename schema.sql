/* Create table */
CREATE TABLE registers (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    current INT DEFAULT(0),
    update_time DATE DEFAULT(NOW())
);
CREATE TABLE members (
    r_id INT REFERENCES registers(id),
    member_id TEXT NOT NULL,
    index INT NOT NULL
);

/* Refresh time stamp when update */
CREATE OR REPLACE FUNCTION update_time_refresh()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = NOW();
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_refresh
BEFORE UPDATE
ON registers
FOR EACH ROW EXECUTE PROCEDURE update_time_refresh();


