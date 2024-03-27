CREATE TABLE activities_tags (
  activity_id UUID,
  tag_id UUID,
  CONSTRAINT act_tag_pk PRIMARY KEY(activity_id, tag_id),
  CONSTRAINT FK_activity FOREIGN KEY (activity_id)
    REFERENCES activities(id),
  CONSTRAINT FK_tag FOREIGN KEY (tag_id)
    REFERENCES tags(id)
);
