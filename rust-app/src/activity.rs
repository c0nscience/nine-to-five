#![allow(clippy::missing_panics_doc)]
use core::fmt;


use chrono::prelude::*;
use sqlx::prelude::*;
use sqlx::PgPool;
use sqlx::Postgres;
use sqlx::QueryBuilder;

use crate::errors;
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
    pub id: sqlx::types::Uuid,
    user_id: String,
    name: String,
}

impl fmt::Display for Tag {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)
    }
}

async fn in_range(
    db: &PgPool,
    user_id: String,
    from: chrono::DateTime<Utc>,
    to: chrono::DateTime<Utc>,
) -> Result<Vec<Range>, errors::AppError> {
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


pub struct Create {
    user_id: String,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
}

#[allow(clippy::missing_errors_doc)]
pub async fn create(db: &PgPool, activity_to_create: Create) -> anyhow::Result<sqlx::types::Uuid> {
    let result = sqlx::query!(
        r#"
            insert into activities(user_id, name, start_time, end_time)
            values ($1, $2, $3, $4)
            returning id
        "#,
        activity_to_create.user_id,
        activity_to_create.name,
        activity_to_create.start_time,
        activity_to_create.end_time,
    )
    .fetch_one(db)
    .await?;
    Ok(result.id)
}

#[derive(Debug)]
pub struct Running {
    id: sqlx::types::Uuid,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    tags: Vec<Tag>,
}

#[allow(clippy::missing_errors_doc)]
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

#[allow(clippy::missing_errors_doc)]
pub async fn stop(db: &PgPool, user_id: String, id: String, end: DateTime<Utc>) -> anyhow::Result<()> {
    let id = sqlx::types::Uuid::parse_str(id.as_str())?;
    sqlx::query!(
        r#"
            UPDATE activities SET end_time = $1 WHERE activities.id = $2 AND activities.user_id = $3
        "#,
        end,
        id,
        user_id)
        .execute(db).await?;
    Ok(())
}

#[derive(Debug)]
pub struct AvailableTag {
    pub id: sqlx::types::Uuid,
    pub name: String
}

#[allow(clippy::missing_errors_doc)]
pub async fn available_tags(db: &PgPool, user_id: String) -> anyhow::Result<Vec<AvailableTag>> {
    let result = sqlx::query_as!(
        AvailableTag, 
        r#"
            SELECT id, name FROM tags WHERE user_id = $1 ORDER BY name
        "#,
        user_id).fetch_all(db).await?;

    Ok(result)
}

async fn associate_tags(db: &PgPool, tags: &[sqlx::types::Uuid], activity_id: sqlx::types::Uuid) -> anyhow::Result<()> {
    if tags.is_empty() {
        return Ok(());
    }
    let mut query_builder = QueryBuilder::<Postgres>::new("INSERT INTO activities_tags (activity_id, tag_id) VALUES ");
    
    for (idx, tag_id) in tags.iter().enumerate() {
        query_builder.push("(");
        query_builder.push_bind(activity_id);
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

async fn delete_associate_tags(db: &PgPool,user_id: String, activity_id: sqlx::types::Uuid) -> anyhow::Result<()> {
    sqlx::query!(r#"
        DELETE FROM activities_tags 
            USING activities
            WHERE activity_id = activities.id AND activities.id = $1 AND activities.user_id = $2
    "#, activity_id, user_id).execute(db).await?;
    Ok(())
}

async fn create_tag(db: &PgPool, user_id: String, name: String) -> anyhow::Result<()>{
    if name.is_empty() {
        return Ok(());
    }

    sqlx::query!(r#"
            INSERT INTO tags(user_id, name)
            VALUES ($1, $2)"#,user_id, name).execute(db).await?;
    
    Ok(())
}

async fn delete(db: &PgPool, user_id: String, id: sqlx::types::Uuid) -> anyhow::Result<()>{
    sqlx::query!(r#"
        DELETE FROM activities_tags 
            USING activities
            WHERE activity_id = activities.id AND activities.id = $1 AND activities.user_id = $2
    "#, id, user_id).execute(db).await?;

    sqlx::query!(r#"
        DELETE FROM activities
            WHERE user_id = $1 AND id = $2
    "#, user_id, id).execute(db).await?;
    
    Ok(())
}

#[derive(Debug)]
pub struct Activity{
    id: sqlx::types::Uuid,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    tags: Vec<Tag>,
}

async fn get(db: &PgPool, user_id: String, id: sqlx::types::Uuid) -> anyhow::Result<Option<Activity>>{
    let result = sqlx::query_as!(
        Activity,
        r#"
        SELECT 
            activities.id, activities.name, activities.start_time, activities.end_time,
            COALESCE(array_agg((tags.id, tags.user_id, tags.name)) filter (WHERE tags.id IS NOT NULL), '{}') AS "tags!: Vec<Tag>"
        FROM activities
        LEFT JOIN activities_tags
            ON activities.id = activities_tags.activity_id
        LEFT JOIN tags
            ON activities_tags.tag_id = tags.id
        WHERE activities.user_id = $1 AND activities.id = $2
        GROUP BY activities.id
        "#,
        user_id,
        id
    )
    .fetch_optional(db)
    .await?;

    Ok(result)
}

#[derive(Debug)]
pub struct Update{
    id: sqlx::types::Uuid,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
}

async fn update(db: &sqlx::Pool<Postgres>, user_id: String, updated_activity: Update) -> anyhow::Result<()> {
   sqlx::query!(r#"
        UPDATE activities SET name = $1, start_time = $2, end_time = $3
            WHERE user_id = $4 AND id = $5
   "#, updated_activity.name, updated_activity.start_time, updated_activity.end_time, user_id, updated_activity.id).execute(db).await?;
    Ok(())
}

async fn tag_exists(db: &sqlx::Pool<Postgres>, user_id: String, name: String) -> anyhow::Result<bool> {
    let exists = sqlx::query!(r#"
        SELECT EXISTS(SELECT 1 FROM tags WHERE name = $2 AND user_id = $1)
    "#, user_id, name).fetch_one(db).await?.exists.unwrap_or_default();
    Ok(exists)
}


