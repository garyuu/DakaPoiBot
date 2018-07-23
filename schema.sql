CREATE OR REPLACE FUNCTION update_time_refresh()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = NOW();
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_refresh
BEFORE UPDATE
ON channels
FOR EACH ROW EXECUTE PROCEDURE update_time_refresh();

