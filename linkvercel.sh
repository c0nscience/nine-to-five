#!/usr/bin/env bash
set -e

JSON=$(cat <<-EOF
{
    "orgId": "$1",
    "projectId": "$2"
}
EOF
)

mkdir .vercel
touch .vercel/project.json
echo "$JSON" > .vercel/project.json
