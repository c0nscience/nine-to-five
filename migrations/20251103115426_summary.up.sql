CREATE TABLE summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    tag_id UUID,
    CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TABLE summary_selection_tags (
    summary_id UUID,
    tag_id UUID,
    CONSTRAINT sum_sel_tag_pk PRIMARY KEY (summary_id, tag_id),
    CONSTRAINT fk_summary FOREIGN KEY (summary_id) REFERENCES summary (id),
    CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TABLE summary_group_tags (
    summary_id UUID,
    tag_id UUID,
    CONSTRAINT sum_grp_tag_pk PRIMARY KEY (summary_id, tag_id),
    CONSTRAINT fk_summary FOREIGN KEY (summary_id) REFERENCES summary (id),
    CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
);
