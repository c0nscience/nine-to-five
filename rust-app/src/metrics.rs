use chrono::Utc;
use serde::Deserialize;
use sqlx::prelude::*;
use sqlx::PgPool;
use sqlx::Postgres;
use sqlx::QueryBuilder;

use crate::activity;

pub mod handlers;

#[derive(Type, Debug, Deserialize)]
#[sqlx(type_name = "metric_type", rename_all = "lowercase")]
enum MetricType {
    Sum,
    Overtime,
    Count,
}

#[derive(Debug)]
#[allow(clippy::struct_field_names)]
struct Metric {
    name: String,
    metric_type: MetricType,
    hours_per_week: Option<i16>,
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
            INSERT INTO metrics(user_id, name, metric_type, hours_per_week)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        "#,
        user_id,
        metric.name,
        metric.metric_type as MetricType,
        metric.hours_per_week,
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

// NOTE: does the inner join makes sense?
// should we limit the result of the metric to one?
// it can technically only every return one or none ... right?
async fn get_by_tags(
    db: &PgPool,
    user_id: String,
    tags: &Vec<sqlx::types::Uuid>,
) -> anyhow::Result<Vec<(chrono::DateTime<Utc>, chrono::DateTime<Utc>)>> {
    let result: Vec<_> = sqlx::query!(
        r#"
            SELECT a.start_time, a.end_time
            FROM activities a
                     JOIN activities_tags at ON a.id = at.activity_id
                     JOIN tags ot ON at.tag_id = ot.id
            WHERE a.user_id = $1
            GROUP BY a.id, a.start_time
            HAVING array_agg(ot.id) @> $2
            ORDER BY a.start_time;
        "#,
        user_id,
        tags
    )
    .fetch_all(db)
    .await?
    .iter()
    .map(|row| (row.start_time, row.end_time.unwrap_or_else(Utc::now)))
    .collect();

    Ok(result)
}

#[derive(Debug)]
struct MetricConfig {
    name: String,
    metric_type: MetricType,
    hours_per_week: Option<i16>,
    tags: Vec<sqlx::types::Uuid>,
}

async fn get_config(
    db: &PgPool,
    user_id: String,
    id: sqlx::types::Uuid,
) -> anyhow::Result<Option<MetricConfig>> {
    let result = sqlx::query_as!(
        MetricConfig,
        r#"
        SELECT 
            metrics.name, metrics.metric_type as "metric_type: MetricType", metrics.hours_per_week,
            COALESCE(array_agg((tags.id)) filter (WHERE tags.id IS NOT NULL), '{}') AS "tags!: Vec<sqlx::types::Uuid>"
        FROM metrics
        LEFT JOIN metrics_tags
            ON metrics.id = metrics_tags.metric_id
        LEFT JOIN tags
            ON metrics_tags.tag_id = tags.id
        WHERE metrics.user_id = $1 AND metrics.id = $2
        GROUP BY metrics.id
        "#,
        user_id,
        id,
    )
    .fetch_optional(db)
    .await?;

    Ok(result)
}

#[derive(Debug)]
struct MetricEdit {
    id: sqlx::types::Uuid,
    name: String,
    metric_type: MetricType,
    hours_per_week: Option<i16>,
    tags: Vec<activity::Tag>,
}

async fn get(
    db: &PgPool,
    user_id: String,
    id: sqlx::types::Uuid,
) -> anyhow::Result<Option<MetricEdit>> {
    let result = sqlx::query_as!(
        MetricEdit,
        r#"
        SELECT 
            metrics.id, metrics.name, metrics.metric_type as "metric_type: MetricType", metrics.hours_per_week,
            COALESCE(array_agg((tags.id, tags.user_id, tags.name)) filter (WHERE tags.id IS NOT NULL), '{}') AS "tags!: Vec<activity::Tag>"
        FROM metrics
        LEFT JOIN metrics_tags
            ON metrics.id = metrics_tags.metric_id
        LEFT JOIN tags
            ON metrics_tags.tag_id = tags.id
        WHERE metrics.user_id = $1 AND metrics.id = $2
        GROUP BY metrics.id
        "#,
        user_id,
        id,
    )
    .fetch_optional(db)
    .await?;

    Ok(result)
}

#[derive(Debug)]
struct Update {
    id: sqlx::types::Uuid,
    name: String,
    metric_type: MetricType,
    hours_per_week: Option<i16>,
}

async fn update(
    db: &sqlx::Pool<Postgres>,
    user_id: String,
    updated_metric: Update,
) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
        UPDATE metrics SET name = $1, metric_type = $2, hours_per_week = $3
            WHERE user_id = $4 AND id = $5
   "#,
        updated_metric.name,
        updated_metric.metric_type as MetricType,
        updated_metric.hours_per_week,
        user_id,
        updated_metric.id
    )
    .execute(db)
    .await?;
    Ok(())
}

async fn associate_tags(
    db: &PgPool,
    tags: &[sqlx::types::Uuid],
    metric_id: sqlx::types::Uuid,
) -> anyhow::Result<()> {
    if tags.is_empty() {
        return Ok(());
    }
    let mut query_builder =
        QueryBuilder::<Postgres>::new("INSERT INTO metrics_tags (metric_id, tag_id) VALUES ");

    for (idx, tag_id) in tags.iter().enumerate() {
        query_builder.push("(");
        query_builder.push_bind(metric_id);
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
    metric_id: sqlx::types::Uuid,
) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM metrics_tags 
            USING metrics 
            WHERE metric_id = metrics.id AND metrics.id = $1 AND metrics.user_id = $2
    "#,
        metric_id,
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
