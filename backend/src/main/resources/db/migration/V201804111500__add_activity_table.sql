CREATE TABLE activity (
  id      BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  name    TEXT,
  start   TIMESTAMP,
  "end"   TIMESTAMP
);

CREATE INDEX activity_user_id_index
  ON activity (user_id);
