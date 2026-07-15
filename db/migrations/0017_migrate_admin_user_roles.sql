-- Data migration for the owner/manager/member role model
-- (docs/self-hosting/boss-employee-flow.md §4). The old model had exactly one
-- "admin" (the operator) and everyone else as "user" — that maps cleanly
-- 1:1 onto owner/member with no manager rows to create.
UPDATE "user" SET "role" = 'owner', "updated_at" = now() WHERE "role" = 'admin';
UPDATE "user" SET "role" = 'member', "updated_at" = now() WHERE "role" = 'user';