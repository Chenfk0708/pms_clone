import { execFileSync } from 'node:child_process'

export type ActiveRoomSeed = {
  poiId: string
  roomCategoryId: string
  roomId: string
}

export function runMysql(sql: string) {
  const mysqlPath = process.env.PMS_MYSQL_PATH ?? 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe'
  return execFileSync(
    mysqlPath,
    [
      `--host=${process.env.PMS_DB_HOST ?? '127.0.0.1'}`,
      `--user=${process.env.PMS_DB_USER ?? 'root'}`,
      `--password=${process.env.PMS_DB_PASSWORD ?? '123456'}`,
      `--database=${process.env.PMS_DB_NAME ?? 'zp_pms'}`,
      '--default-character-set=utf8mb4',
      '--batch',
      '--raw',
      '--execute',
      sql,
    ],
    { encoding: 'utf8' },
  )
}

export function selectActiveRooms(limit: number): ActiveRoomSeed[] {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(`active room seed limit must be a positive integer, got ${limit}`)
  }

  const output = runMysql(`
    SET NAMES utf8mb4;
    SELECT
      CAST(r.poi_id AS CHAR) AS poi_id,
      CAST(r.room_category_id AS CHAR) AS room_category_id,
      CAST(r.room_id AS CHAR) AS room_id
    FROM room r
    JOIN pms_poi pp ON pp.poi_id = r.poi_id
      AND pp.camp_id = r.camp_id
      AND pp.is_deleted = 0
      AND pp.status = 1
    JOIN room_category rc ON rc.room_category_id = r.room_category_id
      AND rc.camp_id = r.camp_id
      AND rc.is_deleted = 0
      AND rc.status = 1
    WHERE r.camp_id = 10001
      AND r.is_deleted = 0
      AND r.status = 1
    ORDER BY r.room_category_id, r.room_id
    LIMIT ${limit};
  `)

  const rows = output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      const [poiId, roomCategoryId, roomId] = line.split('\t')
      return {
        poiId: assertSqlInteger(poiId, 'poi_id'),
        roomCategoryId: assertSqlInteger(roomCategoryId, 'room_category_id'),
        roomId: assertSqlInteger(roomId, 'room_id'),
      }
    })

  if (rows.length < limit) {
    throw new Error(`real DB seed requires ${limit} active rooms in camp 10001, got ${rows.length}`)
  }
  return rows
}

function assertSqlInteger(value: string | undefined, column: string): string {
  if (!value || !/^\d+$/.test(value)) {
    throw new Error(`invalid ${column} from real DB seed query: ${value ?? '<empty>'}`)
  }
  return value
}
