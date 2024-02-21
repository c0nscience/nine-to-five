CREATE TABLE activities(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL, 
  start_time timestamptz NOT NULL,
  end_time timestamptz
);
