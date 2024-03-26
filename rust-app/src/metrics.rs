use chrono::Utc;
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

async fn get_by_metric(
    db: &PgPool,
    user_id: String,
    id: sqlx::types::Uuid,
) -> anyhow::Result<Vec<(chrono::DateTime<Utc>, chrono::DateTime<Utc>)>> {
    let result: Vec<_> = sqlx::query!(
        r#"
            SELECT a.start_time, a.end_time
            FROM activities a
                     JOIN activities_tags at ON a.id = at.activity_id
                     JOIN tags ot ON at.tag_id = ot.id
            WHERE a.user_id = $1
            GROUP BY a.id, a.start_time
            HAVING array_agg(ot.id) @> (SELECT array_agg(t.id)
                                        FROM metrics m
                                                 JOIN metrics_tags mt ON m.id = mt.metric_id
                                                 JOIN tags t ON mt.tag_id = t.id
                                        WHERE m.user_id = $1
                                          AND m.id = $2
                                          AND mt.metric_id = $2)
            ORDER BY a.start_time;
        "#,
        user_id,
        id
    )
    .fetch_all(db)
    .await?
    .iter()
    .map(|row| (row.start_time, row.end_time.unwrap_or_else(|| Utc::now())))
    .collect();

    Ok(result)
}
