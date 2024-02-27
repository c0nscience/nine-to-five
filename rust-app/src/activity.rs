use core::fmt;

use chrono::{prelude::*, LocalResult};
use sqlx::prelude::*;
use sqlx::PgPool;

pub mod handlers;

#[derive(Debug)]
pub struct Activity {
    id: sqlx::types::Uuid,
    user_id: String,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    tags: Vec<Tag>,
}

#[derive(Debug, Type)]
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

pub async fn in_range(
    db: PgPool,
    user_id: String,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
) -> Result<Vec<Activity>, crate::errors::AppError> {
    let Some(from) = from.and_hms_opt(0, 0, 0) else {
        return Err(crate::errors::AppError::InternalError);
    };
    let LocalResult::Single(from) = Utc.from_local_datetime(&from) else {
        return Err(crate::errors::AppError::InternalError);
    };
    let Some(to) = to.and_hms_opt(0, 0, 0) else {
        return Err(crate::errors::AppError::InternalError);
    };
    let LocalResult::Single(to) = Utc.from_local_datetime(&to) else {
        return Err(crate::errors::AppError::InternalError);
    };
    let result = sqlx::query_as!(
        Activity,
        r#"
        SELECT 
            activities.*,
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
    .fetch_all(&db)
    .await?;

    Ok(result)
}

#[derive(Debug)]
pub struct StoreActivity {
    user_id: String,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn create(db: PgPool, activity: StoreActivity) -> Result<(), crate::errors::AppError> {
    sqlx::query!(
        r#"
            insert into activities(user_id, name, start_time, end_time)
            values ($1, $2, $3, $4)
        "#,
        activity.user_id,
        activity.name,
        activity.start_time,
        activity.end_time,
    )
    .execute(&db)
    .await?;
    Ok(())
}
