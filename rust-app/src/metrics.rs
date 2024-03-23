use chrono::prelude::*;
use sqlx::prelude::*;
use sqlx::PgPool;
use sqlx::Postgres;
use sqlx::QueryBuilder;

pub mod handlers;

#[derive(Debug)]
struct Metric {
    name: String,
    tags: Vec<sqlx::types::Uuid>,
}

// NOTE: how to store a metric
// it is based on the configured tags
// are they all bound by a logical AND?
// how can we handle more complex queries?
async fn create(db: &PgPool, user_id: String, metric: Metric) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
            insert into metrics(user_id, name)
            values ($1, $2)
        "#,
        user_id,
        metric.name
    )
    .execute(db)
    .await?;
    Ok(())
}
