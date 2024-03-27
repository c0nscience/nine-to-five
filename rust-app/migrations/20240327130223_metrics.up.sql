CREATE TYPE metric_type AS ENUM ('sum', 'overtime');

CREATE TABLE metrics(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hours_per_week SMALLINT,
  metric_type metric_type NOT NULL
);

CREATE TABLE metrics_tags(
  metric_id UUID,
  tag_id UUID,
  CONSTRAINT met_tag_pk PRIMARY KEY(metric_id, tag_id),
  CONSTRAINT FK_metric FOREIGN KEY (metric_id)
    REFERENCES metrics(id),
  CONSTRAINT FK_tag FOREIGN KEY (tag_id)
    REFERENCES tags(id)
);
