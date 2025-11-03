use sqlx::PgPool;
use sqlx::Postgres;
use sqlx::QueryBuilder;

use crate::activity;

pub mod handlers;

#[derive(Debug)]
#[allow(clippy::struct_field_names)]
struct Summary {
    selection_tags: Vec<sqlx::types::Uuid>,
    group_tags: Vec<sqlx::types::Uuid>,
}

// NOTE: how to store a metric
// it is based on the configured tags
// are they all bound by a logical AND?
// how can we handle more complex queries?
async fn create(db: &PgPool, user_id: String, summary: Summary) -> anyhow::Result<()> {
    let result = sqlx::query!(
        r#"
            INSERT INTO summary(user_id)
            VALUES ($1)
            RETURNING id
        "#,
        user_id,
    )
    .fetch_one(db)
    .await?;

    let mut query_builder =
        QueryBuilder::<Postgres>::new("INSERT INTO summary_selection_tags (summary_id, tag_id) VALUES ");

    for (idx, tag_id) in summary.selection_tags.iter().enumerate() {
        query_builder.push("(");
        query_builder.push_bind(result.id);
        query_builder.push(",");
        query_builder.push_bind(tag_id);
        query_builder.push(")");

        if idx < summary.selection_tags.len() - 1 {
            query_builder.push(",");
        }
    }

    let query = query_builder.build();
    query.execute(db).await?;
    
    let mut query_builder =
        QueryBuilder::<Postgres>::new("INSERT INTO summary_group_tags (summary_id, tag_id) VALUES ");

    for (idx, tag_id) in summary.group_tags.iter().enumerate() {
        query_builder.push("(");
        query_builder.push_bind(result.id);
        query_builder.push(",");
        query_builder.push_bind(tag_id);
        query_builder.push(")");

        if idx < summary.group_tags.len() - 1 {
            query_builder.push(",");
        }
    }

    let query = query_builder.build();
    query.execute(db).await?;
    Ok(())
}

#[derive(Debug)]
pub struct SummaryEdit {
    pub id: sqlx::types::Uuid,
    selection_tags: Vec<activity::Tag>,
    group_tags: Vec<activity::Tag>,
}

pub async fn get(
    db: &PgPool,
    user_id: String,
) -> anyhow::Result<Option<SummaryEdit>> {
    let result = sqlx::query_as!(
        SummaryEdit,
        r#"
        SELECT summary.id,
            COALESCE(array_agg((tags.id, tags.user_id, tags.name)) filter (WHERE tags.id IS NOT NULL), '{}') AS "selection_tags!: Vec<activity::Tag>",
            COALESCE(array_agg((tags.id, tags.user_id, tags.name)) filter (WHERE tags.id IS NOT NULL), '{}') AS "group_tags!: Vec<activity::Tag>"
        FROM summary
        LEFT JOIN summary_selection_tags
            ON summary.id = summary_selection_tags.summary_id
        LEFT JOIN summary_group_tags
            ON summary.id = summary_group_tags.summary_id
        LEFT JOIN tags
            ON summary_selection_tags.tag_id = tags.id OR summary_group_tags.tag_id = tags.id
        WHERE summary.user_id = $1
        GROUP BY summary.id
        "#,
        user_id,
    )
    .fetch_optional(db)
    .await?;

    Ok(result)
}

async fn associate_tags(
    db: &PgPool,
    table: String,
    tags: &[sqlx::types::Uuid],
    summary_id: sqlx::types::Uuid,
) -> anyhow::Result<()> {
    if tags.is_empty() {
        return Ok(());
    }
    let mut query_builder =
        QueryBuilder::<Postgres>::new(format!("INSERT INTO {table} (summary_id, tag_id) VALUES "));

    for (idx, tag_id) in tags.iter().enumerate() {
        query_builder.push("(");
        query_builder.push_bind(summary_id);
        query_builder.push(",");
        query_builder.push_bind(tag_id);
        query_builder.push(")");

        if idx < tags.len() - 1 {
            query_builder.push(",");
        }
    }

    let query = query_builder.build();
    query.execute(db).await?;
    Ok(())
}

async fn delete_associate_tags(
    db: &PgPool,
    user_id: String,
    summary_id: sqlx::types::Uuid,
) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM summary_selection_tags 
            USING summary
        WHERE summary_id = summary.id AND summary.id = $1 AND summary.user_id = $2
        "#,
        summary_id,
        user_id
    )
    .execute(db)
    .await?;
    
    sqlx::query!(
        r#"
        DELETE FROM summary_group_tags 
            USING summary
        WHERE summary_id = summary.id AND summary.id = $1 AND summary.user_id = $2
        "#,
        summary_id,
        user_id
    )
    .execute(db)
    .await?;

    Ok(())
}

async fn delete(db: &PgPool, user_id: String, id: sqlx::types::Uuid) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM metrics_tags 
            USING metrics
            WHERE metric_id = metrics.id AND metrics.id = $1 AND metrics.user_id = $2
    "#,
        id,
        user_id
    )
    .execute(db)
    .await?;

    sqlx::query!(
        r#"
        DELETE FROM metrics
            WHERE user_id = $1 AND id = $2
    "#,
        user_id,
        id
    )
    .execute(db)
    .await?;

    Ok(())
}
