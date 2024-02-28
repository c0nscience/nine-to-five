use core::fmt;

use anyhow::anyhow;
use chrono::{prelude::*, LocalResult};
use sqlx::prelude::*;
use sqlx::PgPool;

pub mod handlers;

pub struct Range {
    id: sqlx::types::Uuid,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    tags: Vec<Tag>,
}

#[derive(Type, Debug)]
#[sqlx(type_name = "tags")]
pub struct Tag {
    id: sqlx::types::Uuid,
    user_id: String,
    name: String,
}

impl fmt::Display for Tag {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)
    }
}

#[allow(clippy::missing_panics_doc)]
pub async fn in_range(
    db: &PgPool,
    user_id: String,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
) -> Result<Vec<Range>, crate::errors::AppError> {
    let from = to_utc(from)?;
    let to = to_utc(to)?;

    let result = sqlx::query_as!(
        Range,
        r#"
        SELECT 
            activities.id, activities.name, activities.start_time, activities.end_time,
            COALESCE(array_agg((tags.id, tags.user_id, tags.name)) filter (WHERE tags.id IS NOT NULL), '{}') AS "tags!: Vec<Tag>"
        FROM activities
        LEFT JOIN activities_tags
            ON activities.id = activities_tags.activity_id
        LEFT JOIN tags
            ON activities_tags.tag_id = tags.id
        WHERE activities.user_id = $1 AND activities.start_time BETWEEN $2 AND $3
        GROUP BY activities.id
        ORDER BY activities.start_time ASC
        "#,
        user_id,
        from,
        to
    )
    .fetch_all(db)
    .await?;

    Ok(result)
}

fn to_utc(nd: chrono::NaiveDate) -> anyhow::Result<chrono::DateTime<Utc>> {
    let Some(nd) = nd.and_hms_opt(0, 0, 0) else {
        return Err(anyhow!("could not add midnight time to naive date"));
    };

    let LocalResult::Single(dt) = Utc.from_local_datetime(&nd) else {
        return Err(anyhow!(
            "could not create date time in utc from naive date time"
        ));
    };

    Ok(dt)
}

pub struct Create {
    user_id: String,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
}

#[allow(clippy::missing_panics_doc)]
pub async fn create(db: PgPool, activity_to_create: Create) -> Result<(), crate::errors::AppError> {
    sqlx::query!(
        r#"
            insert into activities(user_id, name, start_time, end_time)
            values ($1, $2, $3, $4)
        "#,
        activity_to_create.user_id,
        activity_to_create.name,
        activity_to_create.start_time,
        activity_to_create.end_time,
    )
    .execute(&db)
    .await?;
    Ok(())
}

#[derive(Debug)]
pub struct Running {
    id: sqlx::types::Uuid,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    tags: Vec<Tag>,
}

#[allow(clippy::missing_panics_doc)]
pub async fn running(db: &PgPool, user_id: String) -> anyhow::Result<Option<Running>> {
    let result = sqlx::query_as!(
        Running, 
        r#"
        SELECT 
            activities.id, activities.name, activities.start_time, activities.end_time,
            COALESCE(array_agg((tags.id, tags.user_id, tags.name)) filter (WHERE tags.id IS NOT NULL), '{}') AS "tags!: Vec<Tag>"
        FROM activities
        LEFT JOIN activities_tags
            ON activities.id = activities_tags.activity_id
        LEFT JOIN tags
            ON activities_tags.tag_id = tags.id
        WHERE activities.user_id = $1 AND end_time IS NULL
        GROUP BY activities.id
        ORDER BY activities.start_time ASC
        LIMIT 1
        "#,
        user_id
    ).fetch_optional(db).await?;
    Ok(result)
}

#[allow(clippy::missing_panics_doc)]
pub async fn stop(db: &PgPool, user_id: String, id: String) -> anyhow::Result<()> {
    let id = sqlx::types::Uuid::parse_str(id.as_str())?;
    sqlx::query!(
        r#"
            UPDATE activities SET end_time = $1 WHERE activities.id = $2 AND activities.user_id = $3
        "#,
        Utc::now(),
        id,
        user_id)
        .execute(db).await?;
    Ok(())
}
