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
    if metric.tags.is_empty() {
        return Ok(());
    }

    let result = sqlx::query!(
        r#"
            INSERT INTO metrics(user_id, name)
            VALUES ($1, $2)
            RETURNING id
        "#,
        user_id,
        metric.name
    )
    .fetch_one(db)
    .await?;

    let mut query_builder =
        QueryBuilder::<Postgres>::new("INSERT INTO metrics_tags (metric_id, tag_id) VALUES ");

    for (idx, tag_id) in metric.tags.iter().enumerate() {
        query_builder.push("(");
        query_builder.push_bind(result.id);
        query_builder.push(",");
        query_builder.push_bind(tag_id);
        query_builder.push(")");

        if idx < metric.tags.len() - 1 {
            query_builder.push(",");
        }
    }

    let query = query_builder.build();
    query.execute(db).await?;
    Ok(())
}

struct ListMetric {
    id: sqlx::types::Uuid,
    name: String,
}

async fn list_all(db: &PgPool, user_id: String) -> anyhow::Result<Vec<ListMetric>> {
    let metrics = sqlx::query_as!(
        ListMetric,
        r#"
            SELECT id, name
            FROM metrics
            WHERE user_id = $1
            ORDER BY metrics.name
        "#,
        user_id
    )
    .fetch_all(db)
    .await?;

    Ok(metrics)
}
